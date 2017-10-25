import {expect} from "chai";
import {describe, it} from "mocha";
import {isEnabled, convertPercentagePropertyToOptions, option_to_show_user} from "../lib/is-enabled";
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

    it( "should always be TRUE if a feature is enabled and the 'userGroup' value matches a 'userGroup' value in the feature", function () {

        const userGroupFeature = {
            "name": "userGroup",
            "active": true,
            "user_groups": [ "2041-1723", "2055-1010" ]
        };
        const userId = "1";
        const userGroup = "2041-1723";

        expect( isEnabled( userGroupFeature as Feature, userId, userGroup ) ).to.equal( true );

    });

    it( "should be FALSE if a feature is enabled, the user is in the CONTROL group and the feature uses the old percentage property", function () {

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

    it( "should be TRUE if a feature is enabled and the user is in the TEST group and the feature uses the old percentage property", function () {

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

    it( "should be FALSE if a feature is enabled, the user is in the CONTROL group and the feature uses the new options property", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "options": [ true, false ]
        };
        const userId = "1";
        const userGroup = null;

        expect( isEnabled( percentageFeature as Feature, userId, userGroup ) ).to.equal( false );

    });

    it( "should be TRUE if a feature is enabled and the user is in the TEST group and the feature uses the new options property", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "options": [ true, false ]
        };
        const userId = "0";
        const userGroup = null;

        expect( isEnabled( percentageFeature as Feature, userId, userGroup ) ).to.equal( true );

    });

});

describe( "Old property 'percentage' should be converted to new property 'options'", function () {

    it( "should convert a 0 percentage value to a single FALSE boolean option", function() {

        expect( convertPercentagePropertyToOptions( 0 ) ).to.deep.equal([ false ]);

    });

    it( "should convert a none 0 or 100 percentage value to TRUE and FALSE boolean options", function() {

        expect( convertPercentagePropertyToOptions( 50 ) ).to.deep.equal([ true, false ]);

    });

    it( "should convert a 100 percentage value to a single TRUE boolean option", function() {

        expect( convertPercentagePropertyToOptions( 100 ) ).to.deep.equal([ true ]);

    });
});

describe( "the ratio of each option available for the feature should have the same chance of being returned, determinable by the hashed user id", function() {

    it( "should give each option a 50% chance of being picked when TWO options are available", function () {

        const options = [ "one", "two" ];

        expect( option_to_show_user( 33, options ) ).to.equal( "one" );
        expect( option_to_show_user( 66, options ) ).to.equal( "two" );

    });

    it( "should give each option a 33.3% chance of being picked when THREE options are available", function () {

        const options = [ "one", "two", "three" ];

        expect( option_to_show_user( 25, options ) ).to.equal( "one" );
        expect( option_to_show_user( 50, options ) ).to.equal( "two" );
        expect( option_to_show_user( 75, options ) ).to.equal( "three" );

    });

    it( "should give each option a 25% chance of being picked when FOUR options are available", function () {

        const options = [ "one", "two", "three", "four" ];

        expect( option_to_show_user( 15, options ) ).to.equal( "one" );
        expect( option_to_show_user( 35, options ) ).to.equal( "two" );
        expect( option_to_show_user( 65, options ) ).to.equal( "three" );
        expect( option_to_show_user( 85, options ) ).to.equal( "four" );

    });

    it( "should give each option a 20% chance of being picked when FIVE options are available", function () {

        const options = [ "one", "two", "three", "four", "five" ];

        expect( option_to_show_user( 10, options ) ).to.equal( "one" );
        expect( option_to_show_user( 30, options ) ).to.equal( "two" );
        expect( option_to_show_user( 50, options ) ).to.equal( "three" );
        expect( option_to_show_user( 60, options ) ).to.equal( "four" );
        expect( option_to_show_user( 90, options ) ).to.equal( "five" );

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

