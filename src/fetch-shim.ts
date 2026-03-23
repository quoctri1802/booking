const fetchShim = window.fetch.bind(window);
const HeadersShim = window.Headers;
const RequestShim = window.Request;
const ResponseShim = window.Response;

export { fetchShim as default, HeadersShim as Headers, RequestShim as Request, ResponseShim as Response };
