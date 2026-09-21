const { getOrdersCountDB, getNewCustomerCountDB, getRepeatCustomerCountDB, getAverageOrderValueDB, getTotalCustomersDB, getTotalNetRevenueDB, getTotalTaxDB, getRevenueDB, getTopSellingItemsDB } = require("../services/reports.service")
const { getCurrencyDB } = require("../services/settings.service")

exports.getReports = async (req, res) => {
    try {
        const from = req.query.from || null;
        const to = req.query.to || null;
        const type = req.query.type || 'hôm_nay';

        if(type == 'custom') {
            if(!(from && to)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide required details from & to dates!"
                });
            }
        }

        const [ordersCount, newCustomers, repeatedCustomers, averageOrderValue, totalCustomers, netRevenue, taxTotal, revenueTotal, topSellingItems, currency] = await Promise.all([
            getOrdersCountDB(type, from, to),
            getNewCustomerCountDB(type, from, to),
            getRepeatCustomerCountDB(type, from, to),
            getAverageOrderValueDB(type, from, to),
            getTotalCustomersDB(),
            getTotalNetRevenueDB(type, from, to),
            getTotalTaxDB(type, from, to),
            getRevenueDB(type, from, to),
            getTopSellingItemsDB(type, from, to),
            getCurrencyDB(),
        ]);

        return res.status(200).json({
            ordersCount, newCustomers, repeatedCustomers, currency, averageOrderValue, totalCustomers, netRevenue, taxTotal,  topSellingItems, revenueTotal
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};