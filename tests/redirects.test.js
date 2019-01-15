const fs = require('fs');
const path = require('path');
const middy = require('middy');
const axios = require('axios');
const redirects = require('../src/redirects');
const STATUS_CODES = require('http').STATUS_CODES;

const rules = fs.readFileSync(path.join(__dirname, '_redirects')).toString();

// jest.mock('axios');
// jest.mock('../src/storageProvider');
// const S3 = require('../src/storageProvider');

const eventSample = uri => ({
  Records: [
    {
      cf: {
        request: {
          method: 'GET',
          origin: {
            s3: {
              authMethod: 'origin-access-identity',
              customHeaders: {},
              domainName: 'layer-redirects-dev-defaultbucket-1hr6azp5liexa',
              path: '',
              region: 'us-east-1',
            },
          },
          querystring: '',
          uri,
        },
      },
    },
  ],
});
const redirectSample = (uri, status) => ({
  status,
  statusDescription: STATUS_CODES[status],
  headers: {
    location: [{ key: 'Location', value: uri }],
  },
});
const axiosSample = {
  data: {
    login: 'iDVB',
    id: 189506,
    node_id: 'MDQ6VXNlcjE4OTUwNg==',
    avatar_url: 'https://avatars1.githubusercontent.com/u/189506?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/iDVB',
    html_url: 'https://github.com/iDVB',
    followers_url: 'https://api.github.com/users/iDVB/followers',
    following_url: 'https://api.github.com/users/iDVB/following{/other_user}',
    gists_url: 'https://api.github.com/users/iDVB/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/iDVB/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/iDVB/subscriptions',
    organizations_url: 'https://api.github.com/users/iDVB/orgs',
    repos_url: 'https://api.github.com/users/iDVB/repos',
    events_url: 'https://api.github.com/users/iDVB/events{/privacy}',
    received_events_url: 'https://api.github.com/users/iDVB/received_events',
    type: 'User',
    site_admin: false,
    name: 'Dan Van Brunt',
    company: '@KlickInc @KatalystAdvantage ',
    blog: '',
    location: 'Toronto, ON',
    email: null,
    hireable: null,
    bio:
      'Director of Technology @KlickInc \r\nDev, DevOp, Automation Advocate\r\nInto: #docker #serverless #makingiteasy',
    public_repos: 43,
    public_gists: 21,
    followers: 14,
    following: 11,
    created_at: '2010-01-25T16:28:03Z',
    updated_at: '2019-01-07T14:51:44Z',
  },
  status: 200,
  statusText: 'OK',
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'x-ratelimit-limit': '60',
    'x-ratelimit-remaining': '53',
    'x-ratelimit-reset': '1547159078',
    'cache-control': 'public, max-age=60, s-maxage=60',
    etag: 'W/"dc3da1e9a5fad59509e13668ee78d493"',
    'last-modified': 'Mon, 07 Jan 2019 14:51:44 GMT',
    'x-github-media-type': 'github.v3',
  },
};
const proxySample = {
  status: 200,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'x-ratelimit-limit': '60',
    'x-ratelimit-remaining': '53',
    'x-ratelimit-reset': '1547159078',
    'cache-control': 'public, max-age=60, s-maxage=60',
    etag: 'W/"dc3da1e9a5fad59509e13668ee78d493"',
    'last-modified': 'Mon, 07 Jan 2019 14:51:44 GMT',
    'x-github-media-type': 'github.v3',
  },
  statusDescription: 'OK',
  body: {
    login: 'iDVB',
    id: 189506,
    node_id: 'MDQ6VXNlcjE4OTUwNg==',
    avatar_url: 'https://avatars1.githubusercontent.com/u/189506?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/iDVB',
    html_url: 'https://github.com/iDVB',
    followers_url: 'https://api.github.com/users/iDVB/followers',
    following_url: 'https://api.github.com/users/iDVB/following{/other_user}',
    gists_url: 'https://api.github.com/users/iDVB/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/iDVB/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/iDVB/subscriptions',
    organizations_url: 'https://api.github.com/users/iDVB/orgs',
    repos_url: 'https://api.github.com/users/iDVB/repos',
    events_url: 'https://api.github.com/users/iDVB/events{/privacy}',
    received_events_url: 'https://api.github.com/users/iDVB/received_events',
    type: 'User',
    site_admin: false,
    name: 'Dan Van Brunt',
    company: '@KlickInc @KatalystAdvantage ',
    blog: '',
    location: 'Toronto, ON',
    email: null,
    hireable: null,
    bio:
      'Director of Technology @KlickInc \r\nDev, DevOp, Automation Advocate\r\nInto: #docker #serverless #makingiteasy',
    public_repos: 43,
    public_gists: 21,
    followers: 14,
    following: 11,
    created_at: '2010-01-25T16:28:03Z',
    updated_at: '2019-01-07T14:51:44Z',
  },
};

describe('📦 Middleware Redirects', () => {
  // beforeEach(() => {
  //   S3.getObject.mockReset();
  //   S3.getObject.mockClear();
  // });

  const testScenerio = (options, request, callback, done) => {
    // S3.getObject.mockReturnValue({
    //   promise: () => Promise.resolve({ Body: rules }),
    // });

    const handler = middy((event, context, cb) => cb(null, event));
    handler.use(redirects(options));
    handler(request, {}, (err, event) => {
      if (err) throw err;
      callback(event);
      done();
    });
  };

  // test('Redirect should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/internal1'),
  //     event => {
  //       // expect(S3.getObject).toBeCalled();
  //       expect(event).toEqual(redirectSample('/internal2', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Redirect (Internal) with 301 should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/internal3'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/internal4', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Redirect (Internal) with 302 should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/internal5'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/internal6', 302));
  //     },
  //     done,
  //   );
  // });

  // test('Redirect (Internal) with 303 should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/internal7'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/internal8', 303));
  //     },
  //     done,
  //   );
  // });

  // test('Redirect (External) should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/internal9'),
  //     event => {
  //       expect(event).toEqual(redirectSample('https://external.com', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Trailing slash normalization should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/trailingslash'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/trailred', 301));
  //     },
  //     done,
  //   );
  // });

  test('Friendly URLs should redirect', done => {
    testScenerio(
      { rules },
      eventSample('/news/index.htm'),
      event => {
        expect(event).toEqual(redirectSample('/news/', 301));
      },
      done,
    );
  });

  // test('Basic Rewrites should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/news/asdf/index.htm'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/blog/index.html', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Placeholder (Internal) Redirects should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/news/2004/02/12/my-story'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/blog/12/02/2004/my-story', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Placeholder (Internal) Rewrites should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/articles/2004/02/12/my-story'),
  //     event => {
  //       expect(event).toEqual(eventSample('/stories/12/02/2004/my-story'));
  //     },
  //     done,
  //   );
  // });

  // test('Placeholder (External) Redirects should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/things/2004/02/12/my-story'),
  //     event => {
  //       expect(event).toEqual(
  //         redirectSample('https://external.com/stuff/12/02/2004/my-story', 301),
  //       );
  //     },
  //     done,
  //   );
  // });

  // test('Splats (Internal) should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/shop/2004/01/10/my-story'),
  //     event => {
  //       expect(event).toEqual(
  //         redirectSample('/checkout/2004/01/10/my-story', 301),
  //       );
  //     },
  //     done,
  //   );
  // });

  // test('Custom 404s should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/ecommerce'),
  //     event => {
  //       expect(event).toEqual(eventSample('/store-closed'));
  //     },
  //     done,
  //   );
  // });

  // test('Existing URIs files should be ignored', done => {
  //   const inputEvent = eventSample('/existing/index.php');
  //   testScenerio(
  //     { rules },
  //     inputEvent,
  //     event => {
  //       expect(event).toEqual(inputEvent);
  //     },
  //     done,
  //   );
  // });

  // test('Existing URIs files but forced should be handled', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/something/index.html'),
  //     event => {
  //       expect(event).toEqual(redirectSample('/works', 301));
  //     },
  //     done,
  //   );
  // });

  // test('Proxying should work', done => {
  //   axios.get.mockImplementation(() => Promise.resolve(axiosSample));
  //   testScenerio(
  //     { rules },
  //     eventSample('/api/users/iDVB'),
  //     event => {
  //       expect(event).toEqual(eventSample('/api/users/iDVB'));
  //     },
  //     done,
  //   );
  // });

  // test('Catch-all should work', done => {
  //   testScenerio(
  //     { rules },
  //     eventSample('/somerandomlongthing'),
  //     event => {
  //       expect(event).toEqual(eventSample('/index.html'));
  //     },
  //     done,
  //   );
  // });
});
