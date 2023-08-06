/* rules of users
    admin
    agent
*/
function checkPermission(req, res, next) {
  const { role } = req.user;
  if (role == "admin") {
  } else {
    return res.status(400).send({ error: "You can not access here" });
  }
  next();
}
function isAdmin(req, res, next) {
  const { role } = req.user;
  if (role == "admin" || role === "superadmin") {
  } else {
    return res.send({ error: "You can not access here" });
  }
  next();
}
function isSuperAdmin(req, res, next) {
  const { role } = req.user;
  if (role == "superadmin") {
  } else {
    return res.status(403).send({ error: "You can not access here" });
  }
  next();
}
module.exports = {
  checkPermission,
  isAdmin,
  isSuperAdmin,
};
