import {expect} from "chai";
import {describe, it} from "mocha";
import {isEnabled} from "../lib/is-enabled";
import {Feature} from "../lib/signaler-db";

describe( "isEnabled function determines if a feature is enabled", function () {

    it( "should be FALSE if active flag is FALSE", function () {

        const inactiveFeature = {
            "name": "deactivate",
            "active": false
        };
        const userId = "1";
        const userGroup = null;

        expect( isEnabled( inactiveFeature as Feature, userId, userGroup ) ).to.equal( false );

    });

    it( "should be TRUE if a feature is enabled and the 'userGroup' value matches a 'userGroup' value in the feature", function () {

        const userGroupFeature = {
            "name": "userGroup",
            "active": true,
            "user_groups": [ "2041-1723", "2055-1010" ]
        };
        const userId = "1";
        const userGroup = "2041-1723";

        expect( isEnabled( userGroupFeature as Feature, userId, userGroup ) ).to.equal( true );

    });

    it( "should be FALSE if a feature is enabled and the user is in the CONTROL group", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "percentage": 50
        };
        const userId = "1";
        const userGroup = null;

        expect( isEnabled( percentageFeature as Feature, userId, userGroup ) ).to.equal( false );

    });

    it( "should be TRUE if a feature is enabled and the user is in the TEST group", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "percentage": 50
        };
        const userId = "0";
        const userGroup = null;

        expect( isEnabled( percentageFeature as Feature, userId, userGroup ) ).to.equal( true );

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

