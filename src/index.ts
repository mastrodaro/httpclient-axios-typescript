import { AxiosRequestConfig } from "axios";
import * as qs from "qs";
import { HttpEndpoint } from "./HttpEndpoint";
import { HttpMethod } from "./HttpMethod";
import { HttpContentType } from "./HttpContentType";
import { HttpResponseCode } from "./HttpResponseCode";
import HttpClientConfig from "./HttpClientConfig";

const resolveUrl = (endpoint: string, ...args: string[]) =>
  endpoint.replace(/{(\d+)}/g, (match: string, number: number) => {
    if (typeof args[number] === "undefined") {
      throw new Error(
        `Endpoint ${endpoint} path parameters not resolved. Set value for {${number}} with HttpClient.params() method.`,
      );
    }
    return args[number];
  });

export const createAbortController = () => new AbortController();

export {
  HttpEndpoint,
  HttpMethod,
  HttpResponseCode,
  HttpContentType,
  HttpClientConfig,
};

type PathParam = string | number;

type RequestData =
  | string
  | object
  | ArrayBuffer
  | ArrayBufferView
  | URLSearchParams
  | FormData
  | File
  | Blob;

type QueryParams = object | URLSearchParams;

type UploadProgressHandler = (progressEvent: ProgressEvent) => void;

/**
 * HttpClient to communicate with api server
 */
export class HttpClient<T> {
  private readonly endpoint: HttpEndpoint;
  private requestMethod = HttpMethod.GET;
  private additionalHeaders = {};
  private requestData: RequestData = {};
  private endpointParams: string[] = [];
  private requestQueryParams: QueryParams;
  private requestTimeout: number;
  private uploadProgressHandler: UploadProgressHandler;
  private requestAbortSignal: AbortSignal;

  /**
   * Sets request endpoint.
   * @param endpoint - endpoint to be called
   */
  constructor(endpoint: HttpEndpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Sets request method.
   * @param method - one of HTTP methods
   * @returns {HttpClient}
   */
  method(method: HttpMethod): HttpClient<T> {
    this.requestMethod = method;
    return this;
  }

  /**
   * Sets Content-Type header value.
   * @param type - assign request Content-Type. Default: application/json
   * @returns {HttpClient}
   */
  contentType(type: HttpContentType): HttpClient<T> {
    Object.assign(this.additionalHeaders, { "Content-Type": type.valueOf() });
    return this;
  }

  /**
   * Sets data to be sent in request body.
   * Only applicable for request methods PUT, POST, and PATCH
   * @param data - the data to be sent as the request body.
   * @returns {HttpClient}
   */
  data(data: RequestData): HttpClient<T> {
    this.requestData = data;
    return this;
  }

  /**
   * Sets endpoint parameters.
   * @param params - the endpoint parameters to fill path parameters
   * @returns {HttpClient}
   */
  parameters(...params: PathParam[]): HttpClient<T> {
    this.endpointParams = this.endpointParams.concat(
      params.map((param) => encodeURIComponent(param)),
    );
    return this;
  }

  /**
   * Sets the query params.
   * @param params - the URL parameters to be sent with the request
   * @returns {HttpClient}
   */
  queryParams(params: QueryParams): HttpClient<T> {
    this.requestQueryParams = params;
    return this;
  }

  /**
   * Sets connection timeout.
   * @param timeout - time in milliseconds to abort the request
   * @returns {HttpClient}
   */
  timeout(timeout: number): HttpClient<T> {
    this.requestTimeout = timeout;
    return this;
  }

  /**
   * Sets callback on upload progress.
   * @param handler - function to be called on upload progress
   * @returns {HttpClient}
   */
  uploadProgress(handler: UploadProgressHandler): HttpClient<T> {
    this.uploadProgressHandler = handler;
    return this;
  }

  /**
   * Sets the abort signal.
   * @param signal - allows to abort the request
   * @returns {HttpClient}
   */
  abortSignal(signal: AbortSignal): HttpClient<T> {
    this.requestAbortSignal = signal;
    return this;
  }

  /**
   * Executes the request.
   */
  invoke() {
    const requestHeaders = {
      "Content-Type": HttpContentType.JSON,
    };

    Object.assign(requestHeaders, this.additionalHeaders);

    const clientConfig = HttpClientConfig.getConfig();

    const requestConfig: AxiosRequestConfig = {
      method: this.requestMethod,
      url: resolveUrl(this.endpoint, ...this.endpointParams),
      params: this.requestQueryParams,
      headers: requestHeaders,
      data: this.requestData,
      timeout: this.requestTimeout,
      onUploadProgress: this.uploadProgressHandler,
      signal: this.requestAbortSignal,
      paramsSerializer: (params) => qs.stringify(params),
    };

    clientConfig.authHandler?.(requestConfig);

    return clientConfig.axiosInstance
      .request<T>(requestConfig)
      .catch(clientConfig.errorHandler);
  }
}
