import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { nom, email, password, role, assignedSpaceId } = createUserDto;
    const userExists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (userExists) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }
    if (assignedSpaceId) {
      const space = await this.prisma.espace.findUnique({
        where: { id: assignedSpaceId },
      });
      if (!space) {
        throw new BadRequestException('L\'espace assigné spécifié n\'existe pas');
      }
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await this.prisma.user.create({
      data: {
        nom,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'EMPLOYE',
        assignedSpaceId: assignedSpaceId || null,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        assignedSpaceId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return {
      success: true,
      data: user,
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        assignedSpaceId: true,
        assignedSpace: {
          select: {
            id: true,
            nom: true,
            categorie: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        assignedSpaceId: true,
        assignedSpace: {
          select: {
            id: true,
            nom: true,
            categorie: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestor: { id: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // Access control: SUPERADMIN can modify anyone. Owner can modify their own details.
    if (requestor.role !== 'SUPERADMIN' && requestor.id !== id) {
      throw new BadRequestException('Non autorisé à modifier cet utilisateur');
    }

    const { nom, email, password, role, assignedSpaceId } = updateUserDto;
    const updateData: any = {};

    if (nom) updateData.nom = nom;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailExists) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà');
      }
      updateData.email = email.toLowerCase();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Only SUPERADMIN can update role or assignedSpaceId
    if (requestor.role === 'SUPERADMIN') {
      if (role) updateData.role = role;
      if (assignedSpaceId !== undefined) {
        if (assignedSpaceId) {
          const space = await this.prisma.espace.findUnique({
            where: { id: assignedSpaceId },
          });
          if (!space) {
            throw new BadRequestException('L\'espace assigné spécifié n\'existe pas');
          }
          updateData.assignedSpaceId = assignedSpaceId;
        } else {
          updateData.assignedSpaceId = null;
        }
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        assignedSpaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: updatedUser,
    };
  }

  async remove(id: string, requestorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // A SUPERADMIN cannot delete themselves (good practice)
    if (user.id === requestorId) {
      throw new BadRequestException('Impossible de supprimer votre propre compte SUPERADMIN');
    }

    if (user.role === 'SUPERADMIN') {
      const superAdminsCount = await this.prisma.user.count({
        where: { role: 'SUPERADMIN' },
      });
      if (superAdminsCount <= 1) {
        throw new BadRequestException('Impossible de supprimer le dernier compte SUPERADMIN');
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  async updatePassword(id: string, password: string, requestor: { id: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    if (requestor.role !== 'SUPERADMIN' && requestor.id !== id) {
      throw new ForbiddenException('Non autorisé à modifier le mot de passe de cet utilisateur');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    };
  }
}
