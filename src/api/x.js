import fetch from "../utils/request";

export const postX = async () => {
  // API [GET /x GET_CODE_X 名称]
  // API [POST /x POST_CODE_X 名称]
  return fetch("/x");
};
