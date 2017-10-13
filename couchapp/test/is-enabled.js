"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var mocha_1 = require("mocha");
var is_enabled_1 = require("../lib/is-enabled");
mocha_1.describe("isEnabled function determines if a feature is enabled", function () {
    mocha_1.it("should be FALSE if active flag is FALSE", function () {
        var inactiveFeature = {
            "name": "deactivate",
            "active": false
        };
        var userId = "1";
        var userGroup = null;
        chai_1.expect(is_enabled_1.isEnabled(inactiveFeature, userId, userGroup)).to.equal(false);
    });
    mocha_1.it("should be TRUE if a feature is enabled and the 'userGroup' value matches a 'userGroup' value in the feature", function () {
        var userGroupFeature = {
            "name": "userGroup",
            "active": true,
            "user_groups": ["2041-1723", "2055-1010"]
        };
        var userId = "1";
        var userGroup = "2041-1723";
        chai_1.expect(is_enabled_1.isEnabled(userGroupFeature, userId, userGroup)).to.equal(true);
    });
    mocha_1.it("should be FALSE if a feature is enabled and the user is in the CONTROL group", function () {
        var percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "percentage": 50
        };
        var userId = "1";
        var userGroup = null;
        chai_1.expect(is_enabled_1.isEnabled(percentageFeature, userId, userGroup)).to.equal(false);
    });
    mocha_1.it("should be TRUE if a feature is enabled and the user is in the TEST group", function () {
        var percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "percentage": 50
        };
        var userId = "0";
        var userGroup = null;
        chai_1.expect(is_enabled_1.isEnabled(percentageFeature, userId, userGroup)).to.equal(true);
    });
});
// const variants1 = {
//     "name": "variant1",
//     "active": true,
//     "user_groups": [],
//     "variants": [ true, false ]
// };
//
// const variants2 = {
//     "name": "variant2",
//     "active": true,
//     "user_groups": [],
//     "variants": [ "foo", "bar", "lar" ]
// };
//
// const variants3 = {
//     "name": "variant3",
//     "active": true,
//     "user_groups": [],
//     "variants": [ { "name": "foo" }, { "name": "bar" } ]
// };
//
// const variants4 = {
//     "name": "variant4",
//     "active": true,
//     "user_groups": [],
//     "variants": [ 10, 20, 30, 40, 50 ]
// };
//
// const variants5 = {
//     "name": "variant5",
//     "active": true,
//     "user_groups": [],
//     "variants": [ true, "foo", { "name": "bar" }, 40 ]
// };
