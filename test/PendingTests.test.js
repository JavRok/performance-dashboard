const PendingTests = require('../Model/PendingTests');
const Storage = require('../Storage/FileSystemStorage');

test('Create a PendingTests instance, ', async () => {
    expect.assertions(11); // Needed for async testing

    // We depend on the storage for this one, as it's a dependency injection
    const storage = new Storage();
    const pendingTests = new PendingTests(storage);
    expect(pendingTests).toBeInstanceOf(PendingTests);
    await pendingTests.getFromStorage();

    // There's 3 tests in fixtures, with 2 tests sharing the same url
    const singleTest = pendingTests.get('https://www.google.com/');
    expect(singleTest).toHaveProperty('statusCode');
    expect(singleTest).toHaveProperty('data.testId');
    expect(singleTest).toHaveProperty('url');

    const multipleTest = pendingTests.get('https://www.facebook.com/');
    expect(multipleTest).toBeInstanceOf(Array);
    expect(multipleTest.length).toBe(2);
    expect(multipleTest[0]).toHaveProperty('statusCode');
    expect(multipleTest[1]).toHaveProperty('data.testId');
    expect(multipleTest[0].url).toBe(multipleTest[1].url);

    const testsMap = await pendingTests.getAll();
    expect(testsMap).toBeInstanceOf(Map);
    expect(testsMap.size).toBe(2);
});