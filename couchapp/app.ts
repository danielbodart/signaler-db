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
                if (a instanceof Array && b instanceof Array) {
                    return a.length == b.length && a.every((v, i) => v === b[i]);
                }
                return a === b;
            }

            let action = req.form.action;
            if (action === 'Create') {
                feature = {} as Feature;
                feature._id = req.form.name;
                feature.name = req.form.name;
            }
            let redirect: Response = {
                code: 303,
                headers: {"Location": "../../_list/toggle/all#" + feature._id},
                body: "Redirecting..."
            };
            if (action === 'Update' || action === 'Create') {
                let changes: Change[] = [];
                changes.push(change(feature, "active", req.form.active === 'true'));
                changes.push(change(feature, "user_groups", req.form.user_groups.split("\s+").filter(v => Boolean(v))));
                changes.push(change(feature, "percentage", parseInt(req.form.percentage)));
                changes.push(change(feature, "description", req.form.description));
                // changes.push(change(feature, "options", req.form.options));
                changes = changes.filter(c => !equal(c.old_value, c.new_value));

                let history = feature.history || [];
                history.push({
                    user: req.userCtx.name,
                    changes: changes,
                    changed_at: new Date(),
                });
                feature.history = history;

                return [feature, redirect];
            }
            else if (action === 'Delete') {
                feature._deleted = true;
                return [feature, redirect];
            }
            throw new Error(`Unknown action:${action}`)
        }
    },
    lists: {
        toggle(head, req: Request) {
            provides('html', function () {
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
<table>
    <caption>Features</caption>
    <thead>
    <tr>
        <th class="active">Active</th>
        <th class="user_groups">User Groups</th>
        <th class="percentage">Percentage</th>
        <th class="name">Name</th>
        <th class="description">Description</th>
        <th class="actions">Actions</th>
    </tr>
    </thead>
    <tbody>`);
                for (let row = getRow(); row != null; row = getRow()) {
                    let feature: Feature = row.value;


                    send(`<tr id="${feature._id}">
        <td class="active">
            ${ feature.active ? "On" : "Off" }
        </td>
        <td class="user_groups">
            ${feature.user_groups.join("<br>")}
        </td>
        <td class="percentage">
            ${feature.percentage ? feature.percentage : ""}
        </td>
        <td class="name">
            ${feature.name}
        </td>
        <td class="description">
            ${feature.description}
        </td>
        <td class="actions">
            <a class="button" href="../../_show/edit/${feature._id}">Edit</a>
        </td>
    </tr>`);
                }
                send(`</tbody>
    <tfoot>
    <tr><form action="../../_update/toggle/" method="post">
        <td>
            <input type="radio" name="active" value="true"/>
            <input type="radio" name="active" value="false" checked/>
        </td>
        <td>
            <textarea name="user_groups"></textarea>
        </td>
        <td>
            <input type="number" name="percentage" value=""/>
        </td>
        <td>
            <input type="text" name="name" required/>
        </td>
        <td>
            <input type="text" name="description" value=""/>
        </td>
        <td>
            <input class="button" type="submit" name="action" value="Create"/>
        </td>
    </form></tr>
    </tfoot>
</table>
</body>
</html>`);
            });
        },
        features(head, req) {
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
                for (let row = getRow(); row != null; row = getRow()) {
                    if (delimiter) send(',');
                    send("\"" + row.key + "\"" + ':' + isEnabled(row.value, req.query.user_id, req.query.user_group));
                    delimiter = true;
                }
                send('}}');
            });
        }
    },
    shows: {
        edit(feature: Feature, req: Request): string {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Signaler-DB</title>
    <link rel="stylesheet" href="../../style.css"/>
</head>
<body>
<table>
    <caption>Feature</caption>
    <tbody>
    <form action="../../_update/toggle/${feature._id}" method="post">
    <tr>
        <th class="name">Name</th>
        <td class="name">
            <input type="text" name="name" value="${feature.name}" readonly/>
        </td>
    </tr>
    <tr>
        <th class="description">Description</th>
        <td class="description">
            <textarea name="description">${feature.description}</textarea>
        </td>
    </tr>
    <tr>
        <th class="active">Active</th>
                <td class="active">
            <label>On <input type="radio" name="active" value="true" ${ feature.active ? "checked" : "" }/> </label>
            <label><input type="radio" name="active" value="false" ${ feature.active ? "" : "checked" }/> Off </label>
        </td>
    </tr>
    <tr>
        <th class="user_groups">User Groups</th>
        <td class="user_groups">
            <textarea name="user_groups">${feature.user_groups.join("\\n")}</textarea>
        </td>
    </tr>
    <tr>
        <th class="percentage">Percentage</th>
        <td class="percentage">
            <input type="number" name="percentage" value="${feature.percentage}"/>
        </td>
    </tr>
    <tr>
        <th class="actions">Actions</th>
        <td class="actions">
            <input class="button" type="submit" name="action" value="Update"/>
            <input class="button"  type="submit" name="action" value="Delete"/>
        </td>
    </tr>
    </form>
    </tbody>
</table>
</body>
</html>`
        }
    }
};

function fileNameFromPath( path: string ): string {
    return path.split( "/" ).pop();
}

function moduleToString( modulePathRelative: string ): string {
    const fs = require( "fs" );
    require( modulePathRelative );
    const moduleName = fileNameFromPath( modulePathRelative ) + ".js";
    const moduleRef = module.children.filter( child => fileNameFromPath( child.id ) === moduleName )[ 0 ];
    return fs.readFileSync( moduleRef.filename ).toString();
}

loadAttachments(design_doc, join(__dirname, 'attachments'));

design_doc[ "is-enabled" ] = moduleToString( "./lib/is-enabled" );

export = design_doc;
