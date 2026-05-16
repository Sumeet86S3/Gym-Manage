export function success(res, data = null, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function created(res, data = null, message = "Created") {
  return success(res, data, message, 201);
}

export function noContent(res) {
  return res.status(204).send();
}
