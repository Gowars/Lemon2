export interface IHttpOption {
    /** 请求地址 */
    url?: string;
    /** 请求方法 */
    method?: 'POST' | 'GET' | 'DELET' | 'delete' | 'OPTION' | 'post' | 'get' ;
    /** cookie策略 */
    credentials?: 'same-origin';
    /** 请求头 */
    headers?: {
        [string]: string
    };
    /** 跨域是否携带cookie */
    withCredentials?: boolean;
    /** 超时时间 */
    timeout?: number;
    /** 数据类型 */
    dataType?: string;
    /** 请求体 */
    body?: any;
    /** 请求体 */
    data?: any;
    /** 请求发送前hook */
    onBeforeSend?: () => void;
    /** 请求进度回调 */
    onProgress?: () => void;
    /** 请求成功回调 */
    onSuccess?: ({ code: number, msg: string, data: any }) => void;
    /** 请求失败回调 */
    onError?: () => void;
    /** 请求完成回调 */
    onComplete?: () => void;
    /** url query */
    params?: {
        [string]: string
    }
}

export interface CreateFetchOption {
    /** 基础地址 */
    baseUrl?: string;
    /** 基础请求头 */
    headers?: object;
    /** 跨域是否携带cookie */
    withCredentials?: boolean;
    /** 超时时间 */
    timeout?: number;
    /** 数据类型 */
    dataType?: string;
    /** 请求发送前hook */
    onBeforeSend: () => void;
    /** 请求完成hook */
    onComplete?: () => void;
    /** 请求中间件，用来劫持此次网络请求 */
    middlewares?: Array<{request?: any, response?: any}>
}

type IFetch = (url: string, option?: IHttpOption) => Promise<{ code: number, msg: string, data: any }>

export const http: IFetch

export function createHttp(option?: CreateFetchOption): IFetch;

export function ajax(option: IHttpOption);
