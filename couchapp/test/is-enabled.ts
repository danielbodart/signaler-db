import {expect} from "chai";
import {describe, it} from "mocha";
import {
    isEnabled,
    percentageToValues,
    value_to_show_user,
    crc32_to_percentage,
    chooseValue, getValues
} from "../views/lib/is-enabled";
import {Feature} from "../views/lib/signaler-db";

describe("isEnabled function determines if a feature is enabled", function () {

    it("should be FALSE if active flag is FALSE", function () {

        const inactiveFeature = {
            "name": "deactivate",
            "active": false
        };
        const userGroup = null;

        expect(isEnabled(inactiveFeature as Feature, userGroup)).to.equal(false);

    });

    it("should always be TRUE if a feature is enabled and the 'userGroup' value matches a 'userGroup' value in the feature", function () {

        const userGroupFeature = {
            "name": "userGroup",
            "active": true,
            "user_groups": ["2041-1723", "2055-1010"]
        };
        const userGroup = "2041-1723";

        expect(isEnabled(userGroupFeature as Feature, userGroup)).to.equal(true);

    });


    it("should be TRUE if a feature is enabled and the user is in the TEST group and the feature uses the old percentage property", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "percentage": 50
        };
        const userId = "0";
        const userGroup = null;

        expect(isEnabled(percentageFeature as Feature, userGroup)).to.equal(true);

    });

    it("should be TRUE if a feature is enabled and the user is in the TEST group and the feature uses the new options property", function () {

        const percentageFeature = {
            "name": "percentage",
            "active": true,
            "user_groups": [],
            "values": [true, false]
        };
        const userId = "0";
        const userGroup = null;

        expect(isEnabled(percentageFeature as Feature, userGroup)).to.equal(true);

    });

});

describe("chooseValue function", function () {

    it("falls back to percentages if options not set", function () {
        const feature = {
            "name": "percentage",
            "percentage": 50
        };
        expect(chooseValue(feature as Feature, "3")).to.equal(true);
        expect(chooseValue(feature as Feature, "1")).to.equal(false);
    });

    it("will choose from options otherwise", function () {
        const feature = {
            "name": "percentage",
            "values": ["cat", "dog", "mouse"]
        };
        expect(chooseValue(feature as Feature, "3")).to.equal("cat");
        expect(chooseValue(feature as Feature, "2")).to.equal("dog");
        expect(chooseValue(feature as Feature, "1")).to.equal("mouse");
    });

});

describe("getValue function", function () {
    it("returns feature.values when defined", function () {
        expect(getValues({"values": true} as Feature)).to.equal(true);
        expect(getValues({"values": false} as Feature)).to.equal(false);
    });

    it("returns feature.percentage if only that defined", function () {
        expect(getValues({"percentage": 50} as Feature)).to.deep.equal([true,false]);
    });

    it("returns true if nothing defined", function () {
        expect(getValues({} as Feature)).to.equal(true);
    });
});

describe("percentageToValues function", function () {
    it("converts 0% to false", function () {
        expect(percentageToValues(0)).to.deep.equal(false);
    });

    it("converts 50% to an array containing true and false", function () {
        expect(percentageToValues(50)).to.deep.equal([true, false]);
    });

    it("converts 100% to true", function () {
        expect(percentageToValues(100)).to.deep.equal(true);
    });

    it("converts null to true", function () {
        expect(percentageToValues(null)).to.deep.equal(true);
    });
});

describe("value_to_show_user function", function () {

    it("will return value if not an array", function () {
        expect(value_to_show_user(0, true)).to.equal(true);
        expect(value_to_show_user(19, false)).to.equal(false);
    });


    it("supports arrays of values", function () {
        const options = ["one", "two", "three", "four", "five"];

        expect(value_to_show_user(0, options)).to.equal("one");
        expect(value_to_show_user(19, options)).to.equal("one");
        expect(value_to_show_user(20, options)).to.equal("two");
        expect(value_to_show_user(39, options)).to.equal("two");
        expect(value_to_show_user(40, options)).to.equal("three");
        expect(value_to_show_user(59, options)).to.equal("three");
        expect(value_to_show_user(60, options)).to.equal("four");
        expect(value_to_show_user(79, options)).to.equal("four");
        expect(value_to_show_user(80, options)).to.equal("five");
        expect(value_to_show_user(99, options)).to.equal("five");
    });

});

describe("super cautious tests based on actual values Tom pull from Signaler-db", function () {

    it("test", function () {
        const options = [true, false];
        const hashed_user_a = crc32_to_percentage("test-feature-1_000_000-0");
        const hashed_user_b = crc32_to_percentage("test-feature-1_000_000-3");
        expect(value_to_show_user(hashed_user_a, options)).to.equal(true);
        expect(value_to_show_user(hashed_user_b, options)).to.equal(false);
    });

});

