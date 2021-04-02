class CodeError extends Error {
  constructor(code, msg) {
    super(msg);
    this.code = code;
    if (msg) {
      this.message = msg;
    } else {
      this.message = "CodeError:" + code;
    }
  }
}

module.exports = {
  CodeError,
};
