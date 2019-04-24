const fs = require('fs');
const TestResultCollection = require('../Model/TestResultCollection');
const FileSystemStorage = require('../Storage/FileSystemStorage');
const GenericStorage = require('../Storage/GenericStorage');

describe('Test FileSystem Storage class', () => {

    const resultsSample = 'results_sample_n50'; // .json
    let fsStorage;

    beforeEach(() => {
        fsStorage = new FileSystemStorage();
    });

    test('GenericStorage can\'t be used directly', () => {
        expect(() => {
            new GenericStorage();
        }).toThrowError();
    });

    test('Check retrieveResultsCollection, reading hourly results from a file', async () => {
        expect.assertions(2); // Needed for async testing

        const tests = await fsStorage.retrieveResultsCollection(resultsSample);
        expect(tests).toBeInstanceOf(TestResultCollection);
        expect(tests.length()).toBeGreaterThan(1);
    });

    test('Check saveResultsCollection, writing hourly results in a file', async (done) => {
        expect.assertions(5); // Needed for async testing

        const tests = await fsStorage.retrieveResultsCollection(resultsSample);
        const newCollection = new TestResultCollection();
        // We copy a few tests to a new collection
        newCollection.addOrdered(tests.getTestAt(0));
        newCollection.addOrdered(tests.getTestAt(2));
        newCollection.addOrdered(tests.getTestAt(5));

        const ret = await fsStorage.saveResultsCollection('test_file', newCollection);
        expect(ret).toBe(true);
        // We use internal getFilePath function to find the file
        const filePath = fsStorage.getFilePath('test_file', 'results');
        expect(filePath).toMatch('fixtures');
        fs.readFile(filePath, (err, content) => {
            expect(err).toBe(null);
            const readCollection = new TestResultCollection(JSON.parse(content));
            expect(readCollection).toBeInstanceOf(TestResultCollection);
            expect(readCollection.length()).toBe(newCollection.length());

            // Destroy the file after
            fs.unlink(filePath, () => {});
            done();
        })
    });
});
