import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAlluserinfoDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {

    private users = [
        {id: 1, name: 'Alice', email: 'alice@example.com', role: 'ADMIN', password: 'password1', jobTitle: 'CTO'},
        {id: 2, name: 'Bob', email: 'bob@example.com', role: 'MANAGER', password: 'password2', jobTitle: 'Manager'},
        {id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'STAFF', password: 'password3', jobTitle: 'Staff'},
        {id: 4, name: 'David', email: 'david@example.com', role: 'STAFF', password: 'password4', jobTitle: 'Staff'}
    ]

    findAll(role?: 'MANAGER' | 'STAFF' | 'ADMIN') {       //GET request for all users or by role
        if (role)
        {
            const rolesArray = this.users.filter(user=>user.role === role)
            if (rolesArray.length===0) throw new 
            NotFoundException('User Role not Found')
            return rolesArray
        }
        return this.users;
    }

    findOne(id: number){
       const user = this.users.find(user => user.id === id)    //GET request by user  id
       return user
    }

    create(createUserDto:CreateUserDto)  //POST request
    {

        const UsersByHighestId = [...this.users].sort((a,b)=> b.id - a.id)
        const newUser ={
            id:UsersByHighestId[0].id + 1,
            ...createUserDto
        }
        this.users.push(newUser)
        return newUser
    }
    update(id:number,updateUserDto:UpdateUserDto)  //PATCH request
    {
        this.users = this.users.map(user=>{
            if(user.id===id){
                return{...user,...updateUserDto}
            }
            return user
        })
        return this.findOne(id)
    }

    replace(id:number,updateAlluserinfoDto:UpdateAlluserinfoDto) //PUT request
    {
        this.users = this.users.map(user=>{
            if(user.id==id)
            {
                return {id,...updateAlluserinfoDto}
            }
            return user
        })
        return this.findOne(id)
    }

    delete(id:number)
    {
        const removedUser = this.findOne(id)

        this.users = this.users.filter(user => user.id !== id )   //DELETE request
        return removedUser;
    }

}

