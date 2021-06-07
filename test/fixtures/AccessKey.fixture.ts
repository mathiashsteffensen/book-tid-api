import {createToken} from "../../utils";

export module AccessKeyFixture {
    export function create(email?: string ) {
        email = email || "thisisnottheemailofauser@email.com"
        return createToken({ email })
    }
}
