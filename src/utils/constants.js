const errorMessages = {
  SERVER_ERROR: "SERVER_ERROR",
  YOU_ARE_NOT_ALLOWED: "YOU_ARE_NOT_ALLOWED",
};

const errorFormat = {
  SERVER_ERROR: { error: errorMessages.SERVER_ERROR },
  YOU_ARE_NOT_ALLOWED: { error: errorMessages.YOU_ARE_NOT_ALLOWED },
  SEND_FILE_TO_FILE_FEILD: { error: "SEND_FILE_TO_FILE_FEILD" },
  FILE_NOT_DELETED_FROM_CACHE: { error: "file not deleted from cache" },
  FILE_NOT_RENAMED: { error: "file not renamed" },
  FILES_NOT_FOUND: { error: "files not found" },
};

const errors = {
  SERVER_ERROR: (res, message) => res.status(500).send({ ...errorFormat.SERVER_ERROR, ...message }),
  YOU_ARE_NOT_ALLOWED: (res, message) => res.status(400).send({ ...errorFormat.YOU_ARE_NOT_ALLOWED, ...message }),
  SEND_FILE_TO_FILE_FEILD: (res, message) => res.status(400).send({ ...errorFormat.SEND_FILE_TO_FILE_FEILD, ...message }),
  FILE_NOT_DELETED_FROM_CACHE: (res, message) => res.status(500).send({ ...errorFormat.FILE_NOT_DELETED_FROM_CACHE, ...message }),
  FILE_NOT_RENAMED: (res, message) => res.status(500).send({ ...errorFormat.FILE_NOT_RENAMED, ...message }),
  FILES_NOT_FOUND: (res, message) => res.status(500).send({ ...errorFormat.FILES_NOT_FOUND, ...message }),
  ONLY_FILE_ALLOWED: (res, message) => res.status(400).send({ error: `Only ${message} files allowed!` }),
};
module.exports = {
  errorMessages,
  errorFormat,
  errors,
  ...errors,
};
