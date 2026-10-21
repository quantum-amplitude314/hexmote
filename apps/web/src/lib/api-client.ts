import { type Contract, contract } from "@hexmote/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";

const link = new OpenAPILink(contract, { url: () => `${location.origin}/api` });

/** Same origin, so the session cookie goes along; `next dev` rewrites `/api` to the API. */
export const apiClient: JsonifiedClient<ContractRouterClient<Contract>> = createORPCClient(link);
