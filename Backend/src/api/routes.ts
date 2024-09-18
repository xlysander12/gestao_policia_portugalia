import {ChangePasswordRequestBody, LoginRequestBody} from "@portalseguranca/api-types/account/input";

type routesType = {
    [key: string]: {
        methods: {
            [key: string]: {
                body: {
                    type: any
                }
            }
        }
    }
}

/**
 * @description: This file contains all the routes of the API with their respective methods and paths and body types
 */
const routes: routesType = {
    // Route to login a user
    "/accounts/login": {
        "methods": {
            "POST": {
                "body": {
                    "type": LoginRequestBody
                }
            }
        }
    },

    // Route to change the password of a logged user
    "/accounts/changepassword": {
        "methods": {
            "POST": {
                "body": {
                    "type": ChangePasswordRequestBody
                }
            }
        }
    }
}

export default routes;