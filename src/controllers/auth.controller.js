const { CONFIG } = require("../config");
const { signInDB, removeRefreshTokenDB, addRefreshTokenDB, verifyRefreshTokenDB, removeRefreshTokenByDeviceIdDB, getDevicesDB } = require("../services/auth.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

exports.signIn = async (req, res) => {
    try {

        const username = req.body.username;
        const password = req.body.password;

        if(!(username && password)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const result = await signInDB(username, password);

        if(result) {
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            const refreshTokenExpiry = new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH));
            const cookieRefreshTokenOptions = {
                expires: refreshTokenExpiry,
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            result.password = undefined;
            const payload = {
                username: result.username,
                name: result.name,
                role: result.role,
                scope: result.scope
            }
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, cookieRefreshTokenOptions);
            res.cookie('restro__authenticated', true, {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH)),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            })

            // set refresh token in DB.
            const deviceDetails = req.useragent;

            const deviceIP = req.connection.remoteAddress;
            const deviceName = `${deviceDetails.platform}\nBrowser: ${deviceDetails.browser}`;
            const deviceLocation = "";
            await addRefreshTokenDB(username, refreshToken, refreshTokenExpiry, deviceIP, deviceName, deviceLocation);

            return res.status(200).json({
                success: true,
                message: "Đăng nhập thành công.",
                accessToken,
                user: result
            })

        } else {
            return res.status(401).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng!"
            });
        }


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.signOut = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        res.clearCookie('accessToken', {
            expires: new Date(Date.now() ),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });
        res.clearCookie('refreshToken', {
            expires: new Date(Date.now()),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });
        res.clearCookie('restro__authenticated', {
            expires: new Date(Date.now()),
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });

        // remove refreshToken in DB.
        await removeRefreshTokenDB(user.username, refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logout Successful."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getNewAccessToken = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        // verify the refresh token with the DB
        const isExist = await verifyRefreshTokenDB(refreshToken);

        if(isExist) {
            // generate new access token
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };
            const payload = {
                username: user.username,
                name: user.name,
                role: user.role,
                scope: user.scope
            }
            const accessToken = generateAccessToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);

            return res.status(200).json({
                success: true,
                message: "New Token Created Successfully.",
                accessToken
            });
        } else {
            res.clearCookie('accessToken', {
                expires: new Date(Date.now() ),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('refreshToken', {
                expires: new Date(Date.now()),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('restro__authenticated', {
                expires: new Date(Date.now()),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            return res.status(401).json({
                success: false,
                loginNeeded: true,
                message: "Login again to access this page."
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.removeDeviceAccessToken = async (req, res) => {
    try {
        const user = req.user;
        const myRefreshToken = req.cookies.refreshToken;
        const deviceId = req.body.device_id;

        if(myRefreshToken == deviceId) {
            return res.status(400).json({
                success: false,
                message: "Operation not allowed!"
            });
        }

        await removeRefreshTokenByDeviceIdDB(user.username, deviceId);

        return res.status(200).json({
            success: true,
            message: "Device Removed Successfully."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getDevices = async (req, res) => {
    try {
        const user = req.user;
        const myRefreshToken = req.cookies.refreshToken;

        const devices = await getDevicesDB(user.username);

        const modifiedDevices = devices.map((device)=>{
            const newDevice = new Object({...device, isMyDevice: device.refresh_token == myRefreshToken});
            return newDevice;
        });

        return res.status(200).json(modifiedDevices);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};