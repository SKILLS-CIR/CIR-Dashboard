import { Controller, Get ,Post,ParseIntPipe,ValidationPipe} from '@nestjs/common';
import { Body, Delete, Param, Patch, Put, Query } from '@nestjs/common/decorators';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAlluserinfoDto } from './dto/update-user.dto';
@Controller('users')
export class UsersController {
constructor(private readonly usersService: UsersService){}

@Get() //GET /user or /user?role=value
findAll(@Query('role') role?: 'MANAGER' | 'STAFF' | 'ADMIN')
{
    return  this.usersService.findAll(role)
}


@Get(':id')
findOne( @Param( 'id',ParseIntPipe) id: number ) {

    return this.usersService.findOne(id)
}

@Post()
create(@Body(ValidationPipe) createUserDto:CreateUserDto)
{
    return this.usersService.create(createUserDto)
}
@Patch(':id')
update( @Param('id',ParseIntPipe) id:number, @Body(ValidationPipe) updateUserDto:UpdateUserDto)
{
    return this.usersService.update(id,updateUserDto)
}

@Put(':id')
replace(@Param('id',ParseIntPipe) id:number, @Body(ValidationPipe) updateAlluserinfoDto:UpdateAlluserinfoDto)
{
    return this.usersService.replace(id,updateAlluserinfoDto)
}

@Delete(':id')
delete(@Param('id',ParseIntPipe) id:number)
{
    return this.usersService.delete(id)
}
}