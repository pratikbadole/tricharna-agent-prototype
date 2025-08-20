const json = (body, statusCode = 200, extraHeaders = {}) => {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  };
};

module.exports = { json };
