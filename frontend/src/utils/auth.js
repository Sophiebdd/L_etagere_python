export const redirectToLogin = (navigate) => {
  localStorage.removeItem("token");
  navigate("/login", { replace: true });
};
