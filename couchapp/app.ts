import {loadAttachments} from "couchapp";
import {DesignDoc, CouchDoc, UserContextObject, SecurityObject, Request, Response} from "couch";
import {join} from "path";
declare const __dirname: string;

interface Feature extends CouchDoc {
    name: string,
    description: string,
    active: boolean,
    percentage: number,
    user_groups: string[],
    history?: History[],
}

interface History {
    user?: string,
    changes: Change[],
    changed_at: Date,
}

interface Change {
    property: string,
    old_value: any,
    new_value: any,
}

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
        toggle (feature: Feature, req: Request): [CouchDoc, Response] {
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
            let redirect: Response = {
                code: 303,
                headers: {"Location": "../../_list/toggle/all"},
                body: "Redirecting..."
            };
            if (action === 'Create') {
                feature = {} as Feature;
                feature._id = req.form.name;
                feature.name = req.form.name;
            }
            if (action === 'Update' || action === 'Create') {
                let changes: Change[] = [];
                changes.push(change(feature, "active", req.form.active === 'true'));
                changes.push(change(feature, "user_groups", req.form.user_groups.split("\s+").filter(v => Boolean(v))));
                changes.push(change(feature, "percentage", parseInt(req.form.percentage)));
                changes.push(change(feature, "description", req.form.description));
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
        toggle (head, req: Request) {
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
        <th class="active">Active?</th>
        <th class="user_groups">User Groups?</th>
        <th class="percentage">User%</th>
        <th class="name">Name</th>
        <th class="description">Description</th>
        <th class="actions">Actions</th>
    </tr>
    </thead>
    <tbody>`);
                for (let row = getRow(); row != null; row = getRow()) {
                    let feature: Feature = row.value;


                    send(`<tr><form action="../../_update/toggle/${feature._id}" method="post">
        <td class="active">
            <label>On <input type="radio" name="active" value="true" ${ feature.active ? "checked" : "" }/> </label>
            <label><input type="radio" name="active" value="false" ${ feature.active ? "" : "checked" }/> Off </label>
        </td>
        <td class="user_groups">
            <textarea name="user_groups">${feature.user_groups.join("\n")}</textarea>
        </td>
        <td class="percentage">
            <input type="number" name="percentage" value="${feature.percentage}"/>
        </td>
        <td class="name">
            <input type="text" name="name" value="${feature.name}" readonly/>
        </td>
        <td class="description">
            <textarea name="description">${feature.description}</textarea>
        </td>
        <td class="actions">
            <input class="primary-button" type="submit" name="action" value="Update"/>
            <input class="primary-button"  type="submit" name="action" value="Delete"/>
        </td>
    </form></tr>`);
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
            <input type="submit" name="action" value="Create"/>
        </td>
    </form></tr>
    </tfoot>
</table>
</body>
</html>`);
            });
        },
        features (head, req) {
            function isEnabled(feature: Feature, user_id: string, user_group: string) {
                if (feature.active) {
                    if (feature.user_groups.length > 0) {
                        return feature.user_groups.indexOf(user_group) != -1;
                    }
                    if (feature.percentage) {
                        return percentage_enabled_for_user(feature, user_id);
                    }
                    return true;
                }
                return false;
            }

            function makeCRCTable() {
                let c;
                let crcTable = [];
                for (let n = 0; n < 256; n++) {
                    c = n;
                    for (let k = 0; k < 8; k++) {
                        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                    }
                    crcTable[n] = c;
                }
                return crcTable;
            }

            function crc32(str) {
                let crcTable = this.crcTable || (this.crcTable = makeCRCTable());
                let crc = 0 ^ (-1);

                for (let i = 0; i < str.length; i++) {
                    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
                }

                return (crc ^ (-1)) >>> 0;
            }

            function percentage_enabled_for_user(doc, user_id) {
                return crc32(doc.name + "-1_000_000-" + user_id) % 100 < doc.percentage
            }

            provides('json', function () {
                start({
                    "headers": {
                        "Cache-Control": "public, max-age=60",
                        "Content-Type": "application/json"
                    }
                });
                send('{"response":{');
                let delimiter = false;
                for (let row = getRow(); row != null; row = getRow()) {
                    if (delimiter) send(',');
                    send("\"" + row.key + "\"" + ':' + isEnabled(row.value, req.query.user_id, req.query.user_group));
                    delimiter = true;
                }
                send('}}');
            });
        }
    }
};

loadAttachments(design_doc, join(__dirname, 'attachments'));

export = design_doc;
