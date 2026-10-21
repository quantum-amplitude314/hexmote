import { paintCellContract } from "./paint.ts";
import { sessionContract } from "./session.ts";

export const contract = { paintCell: paintCellContract, session: sessionContract };

export type Contract = typeof contract;
