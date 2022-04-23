import { HttpEndpoint, HttpResponseCode } from "../src";

const mockedReturnMany = [
  { id: 1, text: "one" },
  { id: 2, text: "two" },
];

const mockedReturnOne = { id: 1, text: "one" };

const createMockedResponseError = (
  status: number,
  message: string,
  config: any,
) =>
  Promise.reject({
    response: {
      status: status,
      config: config,
      data: {
        statusCode: status,
        message: message,
      },
    },
  });

const createMockedResponse = (
  status: number,
  config: any,
  data: unknown,
  cancel = false,
) =>
  new Promise((resolve, reject) => {
    if (cancel) {
      reject({ message: "canceled" });
    }
    resolve({
      status: status,
      config: config,
      data: data,
      request: {
        path: `/${config.url}?${config.paramsSerializer(config.params)}`,
      },
    });
  });

const axiosRequestMock = jest.fn();
axiosRequestMock.mockImplementation((config: any) => {
  switch (config.url) {
    case HttpEndpoint.PLURAL:
      if (config.onUploadProgress !== undefined) {
        config.onUploadProgress();
      }
      if (config.method === "POST") {
        return createMockedResponse(
          HttpResponseCode.CREATED,
          config,
          config.data,
        );
      }
      return createMockedResponse(
        HttpResponseCode.OK,
        config,
        mockedReturnMany,
        config.signal !== undefined,
      );
    case `${HttpEndpoint.PLURAL}/1`:
      return createMockedResponse(HttpResponseCode.OK, config, mockedReturnOne);
    case HttpEndpoint.NON_EXISTING:
      return createMockedResponseError(
        HttpResponseCode.NOT_FOUND,
        "Cannot get /non_existing",
        config,
      );
    default:
      return createMockedResponse(HttpResponseCode.OK, config, []);
  }
});

export { axiosRequestMock, mockedReturnOne, mockedReturnMany };
