export const JWT_SECRET = process.env.JWT_SECRET;
export const FRONTEND_URL = process.env.FRONTEND_URL || "*";
export const PORT = process.env.PORT || 5000;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}