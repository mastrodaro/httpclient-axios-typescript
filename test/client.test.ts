import {
  createAbortController,
  HttpClient,
  HttpClientConfig,
  HttpContentType,
  HttpEndpoint,
  HttpMethod,
  HttpResponseCode,
} from "../src";
import { API_ADDRESS, HTTP_REQUEST_TIMEOUT } from "./constants";
import { TestObject } from "./TestObject.model";
import {
  axiosRequestMock,
  mockedReturnMany,
  mockedReturnOne,
} from "./axiosRequestMock";

const AUTH_HEADER_NAME = "x-http-token";
const AUTH_TOKEN_VALUE = "test token";

const configureClient = () => {
  HttpClientConfig.configure({
    axiosInstance: {
      request: axiosRequestMock,
    },
    apiAddress: API_ADDRESS,
    authHandler: (config) => {
      config.headers[AUTH_HEADER_NAME] = AUTH_TOKEN_VALUE;
    },
    defaultTimeout: HTTP_REQUEST_TIMEOUT,
    errorHandler: (error) => {
      console.log(error);
      if (error.response) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    },
  });
};

describe("HttpClient tests", () => {
  beforeAll(() => {
    expect(() =>
      new HttpClient<TestObject[]>(HttpEndpoint.PLURAL).invoke(),
    ).toThrowError(
      "HttpClient was not configured. Use HttpClientConfig.configure().",
    );
    configureClient();
  });

  test("Client can be configured only once", () => {
    expect(() => configureClient()).toThrowError(
      "HttpClient has been already configured.",
    );
  });

  test("Client can send GET request", async () => {
    const response = await new HttpClient<TestObject[]>(
      HttpEndpoint.PLURAL,
    ).invoke();
    expect(response.data.length).toEqual(mockedReturnMany.length);
  });

  test("Client exposes response return code", async () => {
    const response = await new HttpClient(HttpEndpoint.PLURAL).invoke();
    expect(response.status).toEqual(HttpResponseCode.OK);
  });

  test("Client can send request with path params", async () => {
    const id = 1;

    const response = await new HttpClient<TestObject>(HttpEndpoint.WITH_GAP)
      .parameters(id)
      .invoke();

    expect(response.data.text).toEqual(mockedReturnOne.text);
  });

  test("When endpoint path params are not filled client will throw and error", () => {
    expect(() =>
      new HttpClient<TestObject>(HttpEndpoint.WITH_GAP).invoke(),
    ).toThrowError(
      "Endpoint objects/{0} path parameters not resolved. Set value for {0} with HttpClient.params() method.",
    );
  });

  test("Client can send POST request with data", async () => {
    const objId = 99;
    const objText = "ninety nine";

    const response = await new HttpClient(HttpEndpoint.PLURAL)
      .method(HttpMethod.POST)
      .data({
        id: objId,
        text: objText,
      })
      .invoke();

    expect(response.data.id).toEqual(objId);
    expect(response.data.text).toEqual(objText);
  });

  test("Client can send GET request with query params", async () => {
    const response = await new HttpClient(HttpEndpoint.PLURAL)
      .queryParams({
        a: 0,
        b: 1,
      })
      .invoke();
    expect(response.request.path).toMatch(/a=0&b=1$/);
  });

  test("Client accepts different Content-Type", async () => {
    const response = await new HttpClient(HttpEndpoint.PLURAL)
      .contentType(HttpContentType.FORM)
      .data("a=1&b=2")
      .invoke();
    expect(response.config.headers).toHaveProperty(
      "Content-Type",
      HttpContentType.FORM,
    );
  });

  test("Client is able to override default timeout per request", async () => {
    const timeout = 6000;
    const response = await new HttpClient(HttpEndpoint.PLURAL)
      .timeout(timeout)
      .invoke();
    expect(response.config.timeout).toEqual(timeout);
  });

  test("Client is able to handle upload progress", async () => {
    const uploadHandler = jest.fn();

    const formData = {
      file: "...",
    };

    const response = await new HttpClient(HttpEndpoint.PLURAL)
      .contentType(HttpContentType.MULTIPART)
      .method(HttpMethod.POST)
      .data(formData)
      .uploadProgress(uploadHandler)
      .invoke();

    expect(response.config.onUploadProgress === uploadHandler);
    expect(uploadHandler).toHaveBeenCalled();
  });

  test("Client can cancel request.", (done) => {
    const abortController = createAbortController();

    new HttpClient(HttpEndpoint.PLURAL)
      .abortSignal(abortController.signal)
      .invoke()
      .catch((err) => {
        expect(err.message).toEqual("canceled");
        done();
      });
    abortController.abort();
  });

  test("Client can handle error, like 404", async () => {
    const response = await new HttpClient(HttpEndpoint.NON_EXISTING).invoke();
    expect(response.status).toEqual(HttpResponseCode.NOT_FOUND);
  });

  test("Client can set authorization headers", async () => {
    const response = await new HttpClient(HttpEndpoint.PLURAL).invoke();
    expect(response.config.headers).toHaveProperty(
      AUTH_HEADER_NAME,
      AUTH_TOKEN_VALUE,
    );
  });
});
