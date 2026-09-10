const { getStoreSettingDB, setStoreSettingDB, getPrintSettingDB, setPrintSettingDB, getTaxesDB, addTaxDB, updateTaxDB, deleteTaxDB, getTaxDB, addPaymentTypeDB, getPaymentTypesDB, updatePaymentTypeDB, deletePaymentTypeDB, togglePaymentTypeDB, addStoreTableDB, getStoreTablesDB, updateStoreTableDB, deleteStoreTableDB, addCategoryDB, getCategoriesDB, updateCategoryDB, deleteCategoryDB, buttonHideMenuDB } = require("../services/settings.service");
exports.getStoreDetails = async (req, res) => {
    try {
        const result = await getStoreSettingDB();

        const storeSettings = {
            storeName: result?.store_name || null,
            address: result?.address || null,
            phone: result?.phone || null,
            email: result?.email || null,
            currency: result?.currency || null,
            image: result?.image || null,
            isQRMenuEnabled: result?.is_qr_menu_enabled || false,
            isPaymentLater: result?.is_payment_later || false
        };

        return res.status(200).json(storeSettings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.setStoreDetails = async (req, res) => {
    try {
        const storeName = req.body.storeName;
        const address = req.body.address;
        const phone = req.body.phone;
        const email = req.body.email;
        const currency = req.body.currency;
        const isQRMenuEnabled = req.body.isQRMenuEnabled;
        const isPaymentLater = req.body.isPaymentLater;

        await setStoreSettingDB(storeName, address, phone, email, currency, isQRMenuEnabled, isPaymentLater);

        return res.status(200).json({
            success: true,
            message: "Dữ liệu chi tiết được lưu thành công."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Có gì đó bị sai, vui lòng thử lại!"
        });
    }
};

exports.getPrintSettings = async (req, res) => {
    try {
        const result = await getPrintSettingDB();

        const printSettings = {
            pageFormat: result?.page_format || null,
            header: result?.header || null,
            footer: result?.footer || null,
            showNotes: result?.show_notes || null,
            isEnablePrint: result?.is_enable_print || null,
            showStoreDetails: result?.show_store_details || null,
            showCustomerDetails: result?.show_customer_details || null,
            printToken: result?.print_token || null
        };

        return res.status(200).json(printSettings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.setPrintSettings = async (req, res) => {
    try {
        const pageFormat = req.body.pageFormat;
        const header = req.body.header;
        const footer = req.body.footer;
        const showNotes = req.body.showNotes;
        const isEnablePrint = req.body.isEnablePrint;
        const showStoreDetails = req.body.showStoreDetails;
        const showCustomerDetails = req.body.showCustomerDetails;
        const printToken = req.body.printToken;

        await setPrintSettingDB(pageFormat, header, footer, showNotes, isEnablePrint, showStoreDetails, showCustomerDetails, printToken);

        return res.status(200).json({
            success: true,
            message: "Details Saved Successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllTaxes = async (req, res) => {
    try {
        const result = await getTaxesDB();
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getTax = async (req, res) => {
    try {
        const taxId = req.params.id;
        const result = await getTaxDB(taxId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addTax = async (req, res) => {
    try {
        const title = req.body.title;
        const taxRate = req.body.rate;
        const type = req.body.type;

        if(!(title && taxRate && type)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const taxId = await addTaxDB(title, taxRate, type);
        return res.status(200).json({
            success: true,
            message: `Tax Details Added.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateTax = async (req, res) => {
    try {
        const taxId = req.params.id;
        const title = req.body.title;
        const taxRate = req.body.rate;
        const type = req.body.type;

        if(!(title && taxRate && type)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateTaxDB(taxId, title, taxRate, type);
        return res.status(200).json({
            success: true,
            message: `Tax Details Updated.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deletTax = async (req, res) => {
    try {
        const taxId = req.params.id;

        await deleteTaxDB(taxId);
        return res.status(200).json({
            success: true,
            message: `Tax Detail Removed.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.addPaymentType = async (req, res) => {
    try {
        const title = req.body.title;
        const isActive = req.body.isActive;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const id = await addPaymentTypeDB(title, isActive);
        return res.status(200).json({
            success: true,
            message: `Payment Type Added.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllPaymentTypes = async (req, res) => {
    try {
        const result = await getPaymentTypesDB();
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updatePaymentType = async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const isActive = req.body.isActive;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updatePaymentTypeDB(id, title, isActive);
        return res.status(200).json({
            success: true,
            message: `Payment Type Updated.`,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.togglePaymentType = async (req, res) => {
    try {
        const id = req.params.id;
        const isActive = req.body.isActive;

        await togglePaymentTypeDB(id, isActive);
        return res.status(200).json({
            success: true,
            message: `Payment Type Status Updated.`,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deletePaymentType = async (req, res) => {
    try {
        const id = req.params.id;

        await deletePaymentTypeDB(id);
        return res.status(200).json({
            success: true,
            message: `Payment Type Deleted.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addStoreTable = async (req, res) => {
    try {
        const title = req.body.title;
        const floor = req.body.floor;
        const seatingCapacity = req.body.seatingCapacity;

        if(!(title && floor && seatingCapacity)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const id = await addStoreTableDB(title, floor, seatingCapacity);
        return res.status(200).json({
            success: true,
            message: `Store Table Added.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllStoreTables = async (req, res) => {
    try {
        const result = await getStoreTablesDB();
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateStoreTable = async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const floor = req.body.floor;
        const seatingCapacity = req.body.seatingCapacity;

        if(!(title && floor && seatingCapacity)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateStoreTableDB(id, title, floor, seatingCapacity);
        return res.status(200).json({
            success: true,
            message: `Store Table Details Updated.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deleteStoreTable = async (req, res) => {
    try {
        const id = req.params.id;

        await deleteStoreTableDB(id);
        return res.status(200).json({
            success: true,
            message: `Store Table Details Deleted.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.addCategory = async (req, res) => {
    try {
        const title = req.body.title;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const id = await addCategoryDB(title);
        return res.status(200).json({
            success: true,
            message: `Category Added.`,
            id
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const result = await getCategoriesDB();
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateCategoryDB(id, title);
        return res.status(200).json({
            success: true,
            message: `Category Updated.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        await deleteCategoryDB(id);
        return res.status(200).json({
            success: true,
            message: `Category Deleted.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.buttonHideMenu = async (req, res) => {
    try {
      const id = req.params.id;
      const isShow = req.body.isShow;

      await buttonHideMenuDB(id, isShow);
      return res.status(200).json({
        success: true,
        message: `Món ăn đã được cập nhật!`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong! Please try later!',
      });
    }
  };
