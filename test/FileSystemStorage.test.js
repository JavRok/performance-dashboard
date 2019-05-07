const fs = require('fs');
const TestResultCollection = require('../Model/TestResultCollection');
const FileSystemStorage = require('../Storage/FileSystemStorage');
const GenericStorage = require('../Storage/GenericStorage');

describe('Test FileSystem Storage class', () => {

    const resultsSample = 'results_sample_n50'; // .json
    const historySample = 'history_sample_n79';
    
    let fsStorage;

    beforeEach(() => {
        fsStorage = new FileSystemStorage();
    });

    test('GenericStorage can\'t be used directly', () => {
        expect(() => {
            new GenericStorage();
        }).toThrowError();
    });


    test('Check getPendingTests, reads pending tests from a folder', async () => {
        expect.assertions(6); // Needed for async testing

        const tests = await fsStorage.getPendingTests();
        expect(tests).toBeInstanceOf(Map);
        expect(tests.size).toBeGreaterThan(0);
        // We get the 1st element with an iterator
        const mapIter = tests.entries();
        const sample = mapIter.next().value[1];
        expect(sample).toHaveProperty('statusCode');
        expect(sample).toHaveProperty('data');
        expect(sample).toHaveProperty('data.testId');
        expect(sample).toHaveProperty('url');
    });


    test('Check addPendingTest, writes temporary object to file', async (done) => {
        expect.assertions(4); // Needed for async testing

        const fileName = await fsStorage.addPendingTest(pendingSample);

        expect(typeof fileName).toBe('string');
        fs.readFile(fileName, (err, content) => {
            expect(err).toBe(null);
            const wptObject = JSON.parse(content);
            expect(wptObject).toHaveProperty('data.testId');
            expect(wptObject).toHaveProperty('url');

            // Destroy the file after
            fs.unlink(fileName, () => {});
            done();
        })
    });


    test('Check retrieveResultsCollection, reading hourly results from a file', async () => {
        expect.assertions(2);

        const tests = await fsStorage.retrieveResultsCollection(resultsSample);
        expect(tests).toBeInstanceOf(TestResultCollection);
        expect(tests.length()).toBeGreaterThan(1);
    });


    test('Check saveResultsCollection, writing hourly results in a file', async (done) => {
        expect.assertions(5);

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


    test('Check retrieveHistoryCollection, reading daily results from a file', async () => {
        expect.assertions(3); // Needed for async testing

        const tests = await fsStorage.retrieveHistoryCollection(historySample);
        expect(tests).toBeInstanceOf(TestResultCollection);
        expect(tests.length()).toBeGreaterThan(1);

        const sampleTest = tests.getTestAt(0);
        // Difference between Results and History, is that tests' ID is a date, format 'yyyy-mm-dd'
        expect(isNaN(Date.parse(sampleTest.id))).toBe(false);
    });


    test('Check saveHistoryCollection, writing daily average results in a file', async (done) => {
        expect.assertions(5); // Needed for async testing

        const tests = await fsStorage.retrieveHistoryCollection(historySample);
        const newCollection = new TestResultCollection();
        // We copy a few tests to a new collection
        newCollection.addOrdered(tests.getTestAt(0));
        newCollection.addOrdered(tests.getTestAt(2));
        newCollection.addOrdered(tests.getTestAt(5));

        const ret = await fsStorage.saveHistoryCollection('test_file_h', newCollection);
        expect(ret).toBe(true);
        // We use internal getFilePath function to find the file
        const filePath = fsStorage.getFilePath('test_file_h', 'history');
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

    const pendingSample = {
        "statusCode": 200,
        "statusText": "Ok",
        "data": {
            "testId": "1234ABCD",
            "ownerKey": "8356ebe7b527fe7f7c7abe9a11ebb1b0ebddd7e7",
            "jsonUrl": "http://52.28.134.156/jsonResult.php?test=1234ABCD",
            "xmlUrl": "http://52.28.134.156/xmlResult/1234ABCD/",
            "userUrl": "http://52.28.134.156/result/1234ABCD/",
            "summaryCSV": "http://52.28.134.156/result/1234ABCD/page_data.csv",
            "detailCSV": "http://52.28.134.156/result/1234ABCD/requests.csv"
        },
        "url": "https://www.google.com/",
        "launchedOn": "2019-5-2 12:20:47",
        "location": "test_wptdriver:Chrome"
    };
});
