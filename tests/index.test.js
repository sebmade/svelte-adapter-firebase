import test from 'ava';
import {fileURLToPath} from 'url';
import {parseFirebaseConfiguration, validCloudFunctionName, validCloudRunServiceId} from '../src/utils.js';

// ParseFirebaseConfiguration: Valid configs
test(
	'Firebase config w Cloud Functions & single site',
	t => {
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson: fileURLToPath(new URL('./fixtures/successes/cf_site.json', import.meta.url))};
		const result = parseFirebaseConfiguration(config);
		const expectedResult = {functions: {name: 'some_func', source: 'functions'}, cloudRun: false, publicDir: 'app'};

		t.deepEqual(result, expectedResult);
	}
);

test(
	'Firebase config w Cloud Functions & multiple sites',
	t => {
		const config = {hostingSite: 'app', sourceRewriteMatch: '**', firebaseJson: fileURLToPath(new URL('./fixtures/successes/cf_sites.json', import.meta.url))};
		const result = parseFirebaseConfiguration(config);
		const expectedResult = {functions: {name: 'some_func', source: 'functions'}, cloudRun: false, publicDir: 'app'};

		t.deepEqual(result, expectedResult);
	}
);

test(
	'Firebase config w Cloud Run & single site',
	t => {
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson: fileURLToPath(new URL('./fixtures/successes/cr_site.json', import.meta.url))};
		const result = parseFirebaseConfiguration(config);
		const expectedResult = {functions: false, cloudRun: {serviceId: 'some-service', region: 'us-central1'}, publicDir: 'app'};

		t.deepEqual(result, expectedResult);
	}
);

test(
	'Firebase config w Cloud Run & multiple sites',
	t => {
		const config = {hostingSite: 'app', sourceRewriteMatch: '**', firebaseJson: fileURLToPath(new URL('./fixtures/successes/cr_sites.json', import.meta.url))};
		const result = parseFirebaseConfiguration(config);
		const expectedResult = {functions: false, cloudRun: {serviceId: 'some-service', region: 'us-central1'}, publicDir: 'app'};

		t.deepEqual(result, expectedResult);
	}
);

// ParseFirebaseConfiguration: Invalid configs
test(
	'Firebase config does not exist',
	t => {
		const firebaseJson = fileURLToPath(new URL('./does_not_exist.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `File ${firebaseJson} does not exist. The provided file should exist and be a Firebase JSON config.`);
	}
);

test(
	'Firebase config is invalid json',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/invalid.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error parsing ${firebaseJson}. Unexpected token } in JSON at position 28`);
	}
);

test(
	'Firebase config without "hosting" field',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/missing_hosting.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting" field required.`);
	}
);

test(
	'Firebase config w multiple sites missing "site" identifier',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/sites_missing_rewrites.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting" configs should identify their "site" name as Firebase supports multiple sites. This site config does not {"public":"some_dir"}`);
	}
);

test(
	'Firebase config multiple sites require a hostingSite to be specified',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cf_multi_site_requires_hostingSite.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. No "hosting[].site" match for undefined. Ensure your svelte.config.js adapter config "hostingSite" matches an item in your Firebase config.`);
	}
);

test(
	'Firebase config w missing "public"',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/site_missing_public.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting[].public" field is required and should be a string. Hosting config with error: {}`);
	}
);

test(
	'Firebase config w site missing "rewrites"',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/site_missing_rewrite.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting[].rewrites" field  required in hosting config and should be an array of object(s). Hosting config with error: {"public":"app"}`);
	}
);

test(
	'Firebase config w "rewrites" mismatch',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cf_site_rewrite_mismatch.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: 'no_match', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting[].rewrites[*]" does not contain a config with "source":"no_match" and either "function" or "run". Is your "sourceRewriteMatch" in svelte.config.js correct?`);
	}
);

test(
	'Firebase config w Cloud Run missing required "serviceId" field',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cr_missing_serviceId.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. Cloud Run rewrite configuration missing required field "serviceId". Rewrite config with error: {"source":"**","run":{}}`);
	}
);

test(
	'Firebase config w Cloud Run incompatible serviceId field',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cr_invalid_serviceId.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. "hosting[].public" field is required and should be a string. Hosting config with error: {"rewrites":[{"source":"**","run":{"serviceId":"anInvalidServiceId"}}]}`);
	}
);

test(
	'Firebase config w Cloud Run incompatible region field',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cr_invalid_region.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. Firebase Hosting rewrites only support "regions":"us-central1" (docs - https://firebase.google.com/docs/functions/locations#http_and_client-callable_functions). Change "not-a-region" accordingly.`);
	}
);

test(
	'Firebase config w Cloud Function invalid name',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cf_invalid_function_name.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. The "serviceId":"invalid-func-name" must use only alphanumeric characters and underscores and cannot be longer than 62 characters.`);
	}
);

test(
	'Firebase config w Cloud Functions & single site missing top-level functions',
	t => {
		const firebaseJson = fileURLToPath(new URL('./fixtures/failures/cf_site_missing_functions.json', import.meta.url));
		const config = {hostingSite: undefined, sourceRewriteMatch: '**', firebaseJson};
		const error = t.throws(() => parseFirebaseConfiguration(config));
		t.is(error.message, `Error with config ${firebaseJson}. If you're using Cloud Functions for your SSR rewrite rule, you need to define a "functions.source" field (of type string) at your config root.`);
	}
);

// ValidCloudRunServiceId
test('Cloud Run serviceId with all valid char types', t => {
	const result = validCloudRunServiceId('is-valid1');
	t.is(result, true);
});

test('Cloud Run serviceId with invalid dash prefix', t => {
	const result = validCloudRunServiceId('-not-valid1');
	t.is(result, false);
});

test('Cloud Run serviceId with invalid dash suffix', t => {
	const result = validCloudRunServiceId('not-valid1-');
	t.is(result, false);
});

test('Cloud Run serviceId with invalid uppercase char', t => {
	const result = validCloudRunServiceId('notValid1');
	t.is(result, false);
});

test('Cloud Run serviceId with invalid non-dash ($) symbol', t => {
	const result = validCloudRunServiceId('not$valid1');
	t.is(result, false);
});

test('Cloud Run serviceId with invalid non-dash (_) symbol', t => {
	const result = validCloudRunServiceId('not_valid1');
	t.is(result, false);
});

test('Cloud Run serviceId with invalid length', t => {
	const result = validCloudRunServiceId('aCloudFunctionsFunctionNameThatIsSeventyFiveCharactersLongWhichIsMoreThan63');
	t.is(result, false);
});

// ValidCloudFunctionName
test('Cloud Function name with valid chars', t => {
	const result = validCloudFunctionName('lowercase_UPPERCASE_0123456789');
	t.is(result, true);
});

test('Cloud Function name with invalid dash', t => {
	const result = validCloudFunctionName('is-invalid');
	t.is(result, false);
});

test('Cloud Function name with invalid length', t => {
	const result = validCloudFunctionName('aCloudFunctionsFunctionNameThatIsSeventyFiveCharactersLongWhichIsMoreThan63');
	t.is(result, false);
});