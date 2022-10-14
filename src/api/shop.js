import fetch from "../utils/request";

export function fetchShopInfo() {
  // API [GET /shop/profile GET_SHOP_PROFILE 查询店铺信息]
  return fetch("/shop/profile");
}

export const fetchShopName = () => {
  // API [GET /shop/name GET_SHOP_NAME 查询店铺名称]
  return fetch("/shop/name");
};
