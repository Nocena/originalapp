import { HttpLink } from "@apollo/client";
import { LENS_API_URL } from "@nocena/data/constants";

const httpLink = new HttpLink({
  uri: LENS_API_URL,
  fetch,
  fetchOptions: "no-cors"
});

export default httpLink;
