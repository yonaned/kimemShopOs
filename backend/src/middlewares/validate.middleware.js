export const validate = (schema, source) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                error: "Validation Error",
                details: error.details.map((detail) => detail.message),
            });
        }
        Object.assign(req[source], value);
        next();
    };
};