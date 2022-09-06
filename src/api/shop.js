import fetch from "../utils/request";

export function fetchShopInfo() {
  return fetch("/shop/profile");
}

export function fetchShopName() {
  return fetch("/shop/name");
}
