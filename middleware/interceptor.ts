
import axios, { AxiosInstance } from "axios";
import {
    URL_BACKEND_PROBLEM,
    URL_BACKEND_USERS,
    URL_PUBLIC_KEY,
    URL_PRIVATE_KEY
} from "../config";
import fs from 'fs'
import jwt from 'jsonwebtoken'

const PRIVATE_KEY = fs.readFileSync(URL_PRIVATE_KEY, "utf8");
export const PUBLIC_KEY = fs.readFileSync(URL_PUBLIC_KEY, "utf8");

const addAuthInterceptor = (instance: AxiosInstance) => {
    instance.interceptors.request.use(
        (config) => {
            const info = {
                from: "backend-contests",
                type: "service"
            }
            try {
                const token = jwt.sign(info, PRIVATE_KEY, { algorithm: "RS256", expiresIn: "15m" });
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            } catch (error) {
                console.error("Error in interceptor:", error);
                throw error;
            }
        },
        (error) => Promise.reject(error)
    );
};

export const apiProblems = axios.create({
    baseURL: URL_BACKEND_PROBLEM,
});

export const apiUsers = axios.create({
    baseURL: URL_BACKEND_USERS,
});
addAuthInterceptor(apiProblems);
addAuthInterceptor(apiUsers);

