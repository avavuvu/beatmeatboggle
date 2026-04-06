export const load = async ({ parent }) => {
    const { isAdmin } = await parent();
    return { isAdmin };
};
