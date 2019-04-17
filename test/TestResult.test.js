const TestResult = require('../Model/TestResult');
const testResultJSON = require('./fixtures/testResultOriginal.json');

test('Create a TestResult instance from the wpt api JSON', () => {
    const testResult = new TestResult(testResultJSON);
    expect(testResult).toBeInstanceOf(TestResult);
    expect(testResult).toHaveProperty('id');
    expect(testResult).toHaveProperty('location');
    expect(testResult).toHaveProperty('firstView.totalTime');
});