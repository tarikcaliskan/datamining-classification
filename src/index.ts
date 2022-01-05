import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import nastyWordList from './words/nasty.json';
import commercialWordList from './words/commercial.json';
import addressWordList from './words/address.json';
import { ObjectMap } from 'csv-writer/src/lib/lang/object';

const PHONE_NUMBER_REGEX = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-s./0-9]*$/;
const NUMBER_REGEX = /\d/;
const withText = false;
const CLASSES = {
	spam: { value: 1, dataKeyword: 'spam' },
	ham: { value: 0, dataKeyword: 'ham' },
};

type ClassType = 'spam' | 'ham';

const csvRows: CSVRowType[] = [];
const nastyWords = nastyWordList.map((word) => word.toLowerCase());
const commercialWords = commercialWordList.map((word) => word.toLowerCase());
const addressWords = addressWordList.map((word) => word.toLowerCase());
const csvMessageHeader = withText ? [{ id: 'message', title: 'SMS' }] : [];
const csvWriter = createObjectCsvWriter({
	path: `${__dirname}/generated/${withText ? 'outputText' : 'output'}.csv`,
	header: [
		...csvMessageHeader,
		{ id: 'nasty', title: 'Nasty Words' },
		{ id: 'commercial', title: 'Commercial Words' },
		{ id: 'phone', title: 'Phone Number' },
		{ id: 'address', title: 'Address Words' },
		{ id: 'numbers', title: 'Numbers' },
		{ id: 'class', title: 'Class' },
	],
});

type CSVRowType = {
	message: string;
	nasty: number;
	commercial: number;
	phone: number;
	address: number;
	numbers: number;
	class: number;
};

function checkWordMatch(message: string, words: string[]) {
	return words.some((word) => message.includes(word)) ? 1 : 0;
}

function classifyMessageLine(line: string) {
	const [messageClass, messageWords] = line.split(/(?<=^\S+)\s/);
	const message = messageWords.toLowerCase();

	const isNasty = checkWordMatch(message, nastyWords);
	const isCommercial = checkWordMatch(message, commercialWords);
	const hasAddress = checkWordMatch(message, addressWords);
	const hasPhoneNumber = PHONE_NUMBER_REGEX.test(message) ? 1 : 0;
	const hasNumber = NUMBER_REGEX.test(message) ? 1 : 0;
	const row = {
		nasty: isNasty,
		commercial: isCommercial,
		phone: hasPhoneNumber,
		address: hasAddress,
		numbers: hasNumber,
		class: CLASSES[messageClass as ClassType].value,
		message,
	};

	csvRows.push(row);
}

async function mainFn() {
	const file = fs.readFileSync(`${__dirname}/data.txt`, { encoding: 'utf8' });
	const lines = file.split('\n');

	lines.map((line) => classifyMessageLine(line));
	csvWriter.writeRecords(csvRows);
	return true;
}

// Run the main function that executes the logic
mainFn();
