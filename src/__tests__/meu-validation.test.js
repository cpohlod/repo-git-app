const assert = require('assert');
const repositoriesFixture = require('./fixtures/repositories.json');

/**
 * Mock GitHub API requests.
 */
const requestMock = async (callback) => {
  await page.setRequestInterception(true);

  // clear old listeners
  await page.removeAllListeners('request');

  page.on('request', async (request) => {
    const url = request.url();
  
    if (url.indexOf('api.github.com') === -1) {
      return request.continue();
    }
  
    await request.respond(callback(url));
  });
};

/**
 * Load page recursive.
 */
const load = async () => {
  try {
    await page.goto('http://localhost:3000');
  } catch (e) {
    await load();
  }
};

const selector = '[data-test="entrada"]';

/**
 * Type into certain input ($eval hack).
 * This is needed cause for whatever reason 'input.type' requires it to be blurred after press.
 */
const type = async (input, string) => {
  await page.$eval(selector, input => input.value = '');

  await input.type(string);
  await input.press('Enter');

  // wait 10ms
  await new Promise(resolve => setTimeout(resolve, 10));
};

/**
 * Wait for selector or fail with message.
 */
const waitForSelector = async (selector, message) => {
  try {
    await page.waitForSelector(selector);
  } catch (e) {
    assert(false, message);
  }
};

/**
 * Find input.
 */
const findInput = async () => {
  await waitForSelector(selector, 'Could not find input.');

  return page.$(selector);
};

/**
 * Assert page contains string.
 */
const assertString = async (string, message) => {
  assert(await page.evaluate(string => document.body.innerText.includes(string), string), message);
};

describe('GitHub', () => {
  beforeEach(load);

  it('should pre-validate user input', async () => {
    let count = 0;

    await requestMock(() => {
      count += 1;

      return {
        status: 200,
        contentType: 'text/plain',
        body: '[]',
      };
    });
    
    const input = await findInput();

    await type(input, '-foo');
    
    assert(count === 0, 'Username should be pre validated to not begin with "-".');

    await type(input, 'foo-');

    assert(count === 0, 'Username should be pre validated to not end with "-".');

    await type(input, 'foobarbazfoobarbazfoobarbazfoobarbazfoobarbaz');

    assert(count === 0, 'Username should be pre validated to have length of less than 39.');

    await type(input, 'foo b.ar');

    assert(count === 0, 'Username should be pre validated to have only alphanumeric and -_ chars.');

    await type(input, 'foo--bar');

    assert(count === 0, 'Username should be pre validated to contain only single "-"');

    await type(input, 'shoul-d-fetch');

    assert(count === 1, 'Should pass.');
  });

  it('should be able to list user repositories', async () => {
    await requestMock(() => ({
      status: 200,
      contentType: 'text/plain',
      body: JSON.stringify(repositoriesFixture),
    }));

    await type(await findInput(), 'myfoouser');

    await waitForSelector('[data-test="repositorio"]', 'Could not find any repository in page!');

    const repositories = await page.$$('[data-test="repositorio"]');

    assert(repositories.length === repositoriesFixture.length, `Could not find all repositories in page (${repositories.length} of ${repositoriesFixture.length})`);

    for (const repository of repositoriesFixture) {
      await assertString(repository.name, `Could not find the repository "${repository.name}" in page`);
      await assertString(repository.stargazers_count, `Could not find repository "${repository.name}" stars count in page`);
    }
  });

  it('should have empty state', async () => {
    await requestMock(() => ({
      status: 200,
      contentType: 'text/plain',
      body: '[]',
    }));

    await type(await findInput(), 'myfoouser');

    await waitForSelector('[data-test="sem-repositorios"]', 'Could not see empty state in page.');
  });

  it('should have 404 state', async () => {
    await requestMock(() => ({
      status: 404,
      contentType: 'text/plain',
      body: JSON.stringify({
        message: 'Not Found',
        documentation_url: 'https://developer.github.com/v3/repos/#list-user-repositories',
      }),
    }));

    await type(await findInput(), 'myfoouser');

    await waitForSelector('[data-test="nao-encontrado"]', 'Could not see 404 state in page.');
  });
});
