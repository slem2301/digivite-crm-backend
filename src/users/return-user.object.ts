import { Prisma } from "generated/prisma/client";

export const returnUserObject: Prisma.UserSelect = {
	id: true,
	email: true,
	name: true,
	password: false,
	jobs: true,
	role: true

}
