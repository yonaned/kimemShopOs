import { parsePhoneNumber } from "libphonenumber-js";

export const normalizePhoneNumber = (input) => {
    try {
        const phoneNumber = parsePhoneNumber(input);
        if (!phoneNumber.isValid()) {
            throw new Error("Invalid phone number");
        }
        return phoneNumber.format("E.164");
    } catch (error) {
        throw new Error("Invalid phone number format");
    }
};