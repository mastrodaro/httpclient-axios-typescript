import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

type MockableAxiosInstance = AxiosInstance | { request: () => any };

type AuthHandlerInternal = (requestConfig: AxiosRequestConfig) => void;
type AuthHandler = (
  requestConfig: AxiosRequestConfig,
  axios: MockableAxiosInstance,
) => void;
type ErrorHandler = (error?: any) => Promise<any>;

const DEFAULT_ERROR_HANDLER = (error) => Promise.reject(error);

interface HttpClientConfigObject {
  axiosInstance?: MockableAxiosInstance;
  apiAddress: string;
  defaultTimeout?: number;
  authHandler?: AuthHandler;
  errorHandler?: ErrorHandler;
}

class HttpClientConfig {
  private static instance: HttpClientConfig;

  private readonly _axiosInstance: MockableAxiosInstance;

  private readonly _authHandler: AuthHandlerInternal;
  private readonly _errorHandler: ErrorHandler;

  private constructor(config: HttpClientConfigObject) {
    this._axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL: config.apiAddress,
        timeout: config.defaultTimeout,
      });

    this._authHandler = (requestConfig) => {
      config.authHandler(requestConfig, this._axiosInstance);
    };
    this._errorHandler = config.errorHandler ?? DEFAULT_ERROR_HANDLER;
  }

  static configure(config: HttpClientConfigObject) {
    if (HttpClientConfig.instance === undefined) {
      HttpClientConfig.instance = new HttpClientConfig(config);
    } else {
      throw new Error("HttpClient has been already configured.");
    }
  }

  static getConfig() {
    if (this.instance === undefined) {
      throw new Error(
        "HttpClient was not configured. Use HttpClientConfig.configure().",
      );
    }
    return this.instance;
  }

  get axiosInstance() {
    return this._axiosInstance;
  }

  get authHandler() {
    return this._authHandler;
  }

  get errorHandler() {
    return this._errorHandler;
  }
}

export default HttpClientConfig;
