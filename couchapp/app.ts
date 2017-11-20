import {loadAttachments} from "couchapp";
import {DesignDoc, CouchDoc, UserContextObject, SecurityObject, Request, Response} from "./lib/couch";
import {join} from "path";
import {Change, Feature, History} from "./lib/signaler-db";

declare const __dirname: string;

let design_doc: DesignDoc = {
    _id: '_design/' + process.env['SIGNALER_VERSION'],
    views: {
        all: {
            map(feature: Feature) {
                emit(feature.name, feature);
            }
        }
    },
    updates: {
        toggle(feature: Feature, req: Request): [CouchDoc, Response] {
            function change(feature: Feature, property: string, new_value: any): Change {
                let old_value = feature[property];
                feature[property] = new_value;
                return {property: property, old_value: old_value, new_value: new_value};
            }

            function equal(a: any, b: any) {
                if (Array.isArray(a) && Array.isArray(b)) {
                    return a.length == b.length && a.every((v, i) => v === b[i]);
                }
                return a === b;
            }

            function toArray(value: string): any[] {
                return value.split("\s+").filter(v => Boolean(v));
            }

            let action = req.form.action;
            if (action === 'Create') {
                feature = {} as Feature;
                feature._id = req.form.name;
                feature.name = req.form.name;
            }

            // migrate old property name
            if (feature['options']) {
                feature.values = feature['options'];
                delete feature['options'];
            }

            let redirect: Response = {
                code: 303,
                headers: {"Location": "../../_list/toggle/all#" + feature._id},
                body: "Redirecting..."
            };
            if (action === 'Update' || action === 'Create') {
                let changes: Change[] = [];
                changes.push(change(feature, "active", req.form.active === 'true'));
                changes.push(change(feature, "user_groups", toArray(req.form.user_groups)));
                changes.push(change(feature, "description", req.form.description));
                changes.push(change(feature, "values", req.form.values == "" ? null : JSON.parse(req.form.values)));
                changes = changes.filter(c => !equal(c.old_value, c.new_value));

                let history = feature.history || [];
                if(changes.length > 0) {
                    history.unshift({
                        user: req.userCtx.name,
                        changes: changes,
                        changed_at: new Date(),
                    });
                }
                // Cleanup old history items
                feature.history = history.map(h => {
                    h.changes = h.changes.filter(c => !equal(c.old_value, c.new_value));
                    return h;
                }).filter(h => h.changes.length > 0).sort( (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());


                return [feature, redirect];
            }
            else if (action === 'Delete') {
                if (feature) feature._deleted = true;
                return [feature, redirect];
            }
            throw new Error(`Unknown action:${action}`)
        }
    },
    lists: {
        toggle(head, req: Request) {
            provides('html', function () {
                const getValues = require("is-enabled").getValues;
                start({
                    "headers": {
                        "Cache-Control": "public, max-age=60",
                        "Content-Type": "text/html"
                    }
                });
                send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Signaler-DB</title>
    <link rel="stylesheet" href="../../style.css"/>
</head>
<body>
<table sortable>
    <caption>Features <a class="button" href="../../_show/edit/">New</a></caption>
    <thead>
    <tr>
        <th class="active">Active</th>
        <th class="name">Name</th>
        <th class="values">Values</th>
        <th class="Percentage">Percentage</th>
        <th class="description">Description</th>
        <th class="user_groups">User Groups</th>
    </tr>
    </thead>
    <tbody>`);
                for (let row = getRow(); row != null; row = getRow()) {
                    let feature: Feature = row.value;
                    let values = getValues(feature);
                    let percentage = values.constructor === Array ? 100 / values.length : 100;

                    send(`<tr id="${feature._id}" class="feature ${feature.active ? "on" : "off" }">
        <td class="active">
            <a href="../../_show/edit/${feature._id}">${ feature.active ? "On" : "Off" }</a>
        </td>
        <td class="name">
            <a href="../../_show/edit/${feature._id}">${feature.name}</a>
        </td>
        <td class="values">
            <a href="../../_show/edit/${feature._id}">${JSON.stringify(values)}</a>
        </td>
        <td class="percentage">
            <a href="../../_show/edit/${feature._id}">${percentage == 100 ? "" : percentage + "%" }</a>
        </td>
        <td class="description">
            <a href="../../_show/edit/${feature._id}">${feature.description}</a>
        </td>
        <td class="user_groups">
            <a href="../../_show/edit/${feature._id}">${feature.user_groups.join("<br>")}</a>
        </td>
    </tr>`);
                }
                send(`</tbody>
</table>
</body>
</html>`);
            });
        },
        features(head, req: Request) {
            provides('json', function () {
                start({
                    "headers": {
                        "Cache-Control": "public, max-age=60",
                        "Content-Type": "application/json"
                    }
                });
                send('{"response":{');
                let delimiter = false;
                const isEnabled = require("is-enabled").isEnabled;
                const chooseValue = require("is-enabled").chooseValue;

                for (let row = getRow(); row != null; row = getRow()) {
                    let feature = row.value as Feature;
                    if (isEnabled(feature, req.query.user_group)) {
                        if (delimiter) send(',');
                        send("\"" + row.key + "\"" + ':' + JSON.stringify(chooseValue(feature, req.query.user_id)));
                        delimiter = true;
                    }
                }
                send('}}');
            });
        }
    },
    shows: {
        edit(feature: Feature, req: Request): string {
            if (feature == null) {
                feature = {} as Feature;
                feature._id = "";
                feature.name = "";
                feature.description = "";
                feature.user_groups = [];
            }
            const getValues = require("is-enabled").getValues;

            function toList(values: any[]): string {
                return values.join("\n");
            }

            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Signaler-DB</title>
    <link rel="stylesheet" href="../../style.css"/>
</head>
<body>
<form action="../../_update/toggle/${feature._id}" method="post">
<table>
    <caption>
    <span class="active">
            <input type="radio" name="active" id="on" value="true" ${ feature.active ? "checked" : "" }/><input type="radio" name="active" id="off" value="false" ${ feature.active ? "" : "checked" }/><label for="on">On</label><label for="off">Off</label>
    </span>
    Feature
    <span class="actions">
            <input class="button" type="submit" name="action" value="${feature.name == "" ? "Create" : "Update"}"/>
            <input class="button danger"  type="submit" name="action" value="Delete"  onclick="return confirm('Delete');"/>
    </span>
    </caption>
    <tbody>
    <tr>
        <th class="name">Name</th>
        <td class="name">
            <input type="text" name="name" value="${feature.name}" ${feature.name == "" ? "" : "readonly"}/>
        </td>
    </tr>
    <tr>
        <th class="values">Values</th>
        <td class="values">
            <textarea name="values">${JSON.stringify(getValues(feature))}</textarea>
        </td>
    </tr>
    <tr>
        <th class="description">Description</th>
        <td class="description">
            <textarea name="description">${feature.description}</textarea>
        </td>
    </tr>
    <tr>
        <th class="user_groups">User Groups</th>
        <td class="user_groups">
            <textarea name="user_groups">${toList(feature.user_groups)}</textarea>
        </td>
    </tr>
    </tbody>
</table>
</form>

<table>
<caption>History</caption>
<thead>
<tr><th rowspan="2">Changed At</th><th colspan="3">Changes</th><th rowspan="2">User</th></tr>
<tr><th>Property</th><th>Old Value</th><th>New Value</th></tr>
</thead>
<tbody>
${ feature.history ? feature.history.map(item => {
                function c(change: Change) {
                    return `<td>${change.property}</td><td>${change.old_value ? change.old_value : ""}</td><td>${change.new_value}</td>`;
                }

                return `<tr>
<td rowspan="${item.changes.length}">${item.changed_at}</td>
${c(item.changes[0])}
<td rowspan="${item.changes.length}">${item.user ? item.user : "Anonymous" }</td>
</tr>
${item.changes.length > 1 ? item.changes.slice(1).map(change => {
                    return ` <tr>${c(change)}</tr>`
                }).join("") : ""}
`
            }).join("") : ""}
</tbody>
</table>

</body>
</html>`
        }
    }
};

function fileNameFromPath(path: string): string {
    return path.split("/").pop();
}

function moduleToString(modulePathRelative: string): string {
    const fs = require("fs");
    require(modulePathRelative);
    const moduleName = fileNameFromPath(modulePathRelative) + ".js";
    const moduleRef = module.children.filter(child => fileNameFromPath(child.id) === moduleName)[0];
    return fs.readFileSync(moduleRef.filename).toString();
}

loadAttachments(design_doc, join(__dirname, 'attachments'));

design_doc["is-enabled"] = moduleToString("./lib/is-enabled");

export = design_doc;
