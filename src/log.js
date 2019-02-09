module.exports = ({ context, message, level = 'info' }) => {
  const repo = context.payload.repository;
  const prefix = repo ? `${repo.full_name}: ` : '';
  const logString = `${prefix}${message}`;

  // filter against typos and bad input levels
  const knownLevel = /trace|debug|info|warn|error|fatal/.test(level)
    ? level
    : 'info';
  const logger = context.log[knownLevel];

  logger(logString);
};
