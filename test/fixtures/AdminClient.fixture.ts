import { AdminClient, UserInfo } from "../../db/models";

export module AdminClientFixture {
  export async function create(options?: UserInfo) {
    const params: UserInfo = {
      name: {
        firstName: "John",
        lastName: "Johnson",
        ...options?.name,
      },
      email: options?.email || "john@example.com",
      password: options?.password || "password",
      businessInfo: {
        name: "Bizness",
        address: {
          city: "City",
          number: "2",
          street: "Streetway",
          postcode: "2000",
          ...options?.businessInfo?.address,
        },
        ...options?.businessInfo,
      },
    };

    const user = await AdminClient.findOne({ email: params.email }).exec();

    if (user) return user;

    return AdminClient.createDefault(params, "key", { id: "id" });
  }
}
