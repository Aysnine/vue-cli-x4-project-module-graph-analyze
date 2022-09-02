export function fetchUserInfo() {
  // #API USER_PROFILE
  return fetch("/user/profile");
}

export function fetchUserName() {
  return fetch("/user/name");
}

export default {
  fetchUserName() {
    return fetch("/user/name");
  },
};