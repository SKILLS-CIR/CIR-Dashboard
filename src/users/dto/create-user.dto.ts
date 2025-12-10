import { IsEmail, IsEnum, IsNotEmpty,IsString } from "class-validator";


export class CreateUserDto{
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsEmail()
    email: string;
    @IsEnum(["MANAGER", "STAFF", "ADMIN"],{
        message: 'Valid role required'
    })
    role: "MANAGER" | "STAFF" | "ADMIN";
    @IsString()
    @IsNotEmpty()
    password: string;
    @IsString()
    @IsNotEmpty()
    jobTitle: string;

}