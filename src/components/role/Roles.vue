<template>
  <div id="roles">
    <!-- 面包导航 -->
    <el-breadcrumb separator="/" style="padding-left:10px;padding-bottom:10px;font-size:12px;">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>系统管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色管理</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片主体 -->
    <el-card class="box-card">
      <!-- 上面工具栏 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            clearable
            size="mini"
            placeholder="请输入角色名查询"
            v-model="queryMap.roleName"
            class="input-with-select"
            @clear="getRoleList"
          >
            <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
          </el-input>
        </el-col>
        <el-col :span="2">
          <el-button
                  size="mini"
            v-hasPermission="'role:add'"
            type="success"
            icon="el-icon-circle-plus-outline"
            @click="addDialogVisible=true"
          >添加</el-button>
        </el-col>
      </el-row>
      <!-- 表格区域 -->
      <template>
        <el-table
          v-loading="loading"
          :data="roleData"
          border
          style="width: 100%;margin-top:20px;"
          height="470"
          size="mini"
        >
          <el-table-column prop="roleId" label="ID" width="180"></el-table-column>
          <el-table-column prop="roleName" label="角色名" width="180"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="150"></el-table-column>
          <el-table-column prop="isban" label="是否禁用" width="100">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.state" @change="changRoleStatus(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注"></el-table-column>
          <el-table-column fixed="right" label="操作" width="200">
            <template slot-scope="scope">
              <el-button

                @click="grant(scope.row.roleId)"
                type="text"
                icon="el-icon-present"
                size="small"
              >授权</el-button>
              <el-button @click="edit(scope.row.roleId)" v-hasPermission="'role:edit'" type="text" icon="el-icon-edit" size="small">编辑</el-button>
              <el-button
               v-hasPermission="'role:delete'"
                @click="del(scope.row.roleId)"
                type="text"
                icon="el-icon-delete"
                size="small"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <!-- 分页部分 -->
      <el-pagination
        background
        style="margin-top:10px;"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryMap.pageNum"
        :page-sizes="[7, 16, 32, 64]"
        :page-size="queryMap.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
      <!-- 添加弹框 -->
      <el-dialog title="添加角色" :visible.sync="addDialogVisible" width="50%" @close="closeAdd">
        <el-form ref="addFormRef" :model="addForm" label-width="80px" :rules="addFormRoles">
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="addForm.roleName"></el-input>
          </el-form-item>
          <el-form-item label="描述信息" prop="remark">
            <el-input type="textarea" v-model="addForm.remark"></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button
            type="primary"
            @click="addRole"
            :loading="btnLoading"
            :disabled="btnDisabled"
          >确 定</el-button>
        </span>
      </el-dialog>
      <!-- 编辑弹框 -->
      <el-dialog title="编辑角色" :visible.sync="editDialogVisible" width="50%" @close="closeEdit">
        <el-form ref="editFormRef" :model="editForm" label-width="80px" :rules="addFormRoles">
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="editForm.roleName"></el-input>
          </el-form-item>
          <el-form-item label="描述信息" prop="remark">
            <el-input type="textarea" v-model="editForm.remark"></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button
            type="primary"
            @click="updateRole"
            :loading="btnLoading"
            :disabled="btnDisabled"
          >确 定</el-button>
        </span>
      </el-dialog>
      <!-- 角色授权弹出框 -->
      <el-dialog title="分配菜单权限" :visible.sync="grantDialogVisible" width="38%">
        <span>
          <el-tree
            :auto-expand-parent="false"
            :data="data"
            show-checkbox
            node-key="menuId"
            :default-expanded-keys="open"
            :props="defaultProps"
            ref="tree"
            highlight-current
          ></el-tree>
          <!-- check-strictly -->
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="grantDialogVisible = false">取 消</el-button>
          <el-button
            v-hasPermission="'role:authority'"
            type="primary"
            icon="el-icon-setting"
            @click="authority"
            :loading="btnLoading"
            :disabled="btnDisabled"
          >授 权</el-button>
        </span>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data () {
    return {
      btnLoading: false,
      btnDisabled: false,
      loading: true,
      total: 0,
      queryMap: { roleName: '', pageNum: 1, pageSize: 7 }, // 查询条件
      roleData: [], // 角色表格数据
      addForm: {}, // 添加数据
      editForm: {}, // 编辑数据
      addDialogVisible: false, // 添加弹框的显示
      editDialogVisible: false, // 编辑弹框
      grantDialogVisible: false, // 授权弹出框
      data: [],
      open: [], // 展开
      grantId: '',
      defaultProps: {
        children: 'children',
        label: 'menuName'
      },
      addFormRoles: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' },
          { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
        ],
        remark: [
          { required: true, message: '请输入角色描述信息', trigger: 'blur' },
          { min: 5, max: 20, message: '长度在 5 到 20 个字符', trigger: 'blur' }
        ]
      } // 添加验证规则
    }
  },
  methods: {


    // 获取选中的节点
    async authority () {
      this.btnDisabled = true
      this.btnLoading = true
      const { data: res } = await this.$http.post(
        'role/authority/' + this.grantId,
        [].concat(
          this.$refs.tree.getCheckedKeys(),
          this.$refs.tree.getHalfCheckedKeys()
        )
      )
      if (res.code === 200) {
        this.$message.success('角色授权成功')
      } else {
        this.$message.error('角色授权失败:' + res.msg)
      }
      this.btnDisabled = false
      this.btnLoading = false
      this.grantDialogVisible = false
    },

    // 用户授权
    async grant (roleId) {
      // 加载所有菜单以及用户拥有的菜单权限roleId
      const { data: res } = await this.$http.get('role/findByMenu/' + roleId)
      if (res.code === 200) {
        // 默认选中的树的数据
        let that = this
        setTimeout(function () {
          res.data.mids.forEach(value => {
            that.$refs.tree.setChecked(value, true, false)
          })
        }, 100)
        console.log(res.data.tree)
        this.data = res.data.tree
        this.open = res.data.open
        this.grantId = roleId // 需要授权的roleId
      }
      this.grantDialogVisible = true
    },
    // 加载用户列表
    async getRoleList () {
      const { data: res } = await this.$http.get('role/findRoleList', {
        params: this.queryMap
      })
      if (res.code === 200) {
        this.roleData = res.data.roleList.rows
        this.total = res.data.roleList.total
      }
    },
    // 搜索
    search () {
      this.queryMap.pageNum = 1
      this.getRoleList()
    },
    // 关闭添加弹框
    closeAdd () {
      this.$refs.addFormRef.clearValidate()
      this.addForm = {}
    },
    closeEdit () {
      this.$refs.editFormRef.clearValidate()
      this.editForm = {}
    },
    // 添加
    async addRole () {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) {

        } else {
          this.btnDisabled = true
          this.btnLoading = true
          const { data: res } = await this.$http.post('role/add', this.addForm)
          if (res.code === 200) {
            this.$message.success('添加成功')
            this.addDialogVisible = false
            this.btnDisabled = false
            this.btnLoading = false
            this.addForm = {}
            this.getRoleList()
          } else {
            return this.$message.error('角色添加失败:' + res.msg)
          }
        }
      })
    },
    // 编辑
    async edit (roleId) {
      const { data: res } = await this.$http.get('role/edit/' + roleId)
      if (res.code === 200) {
        this.editForm = res.data.roleVo
        this.editDialogVisible = true
      } else {
        return this.$message.error('角色编辑失败:' + res.msg)
      }
    },
    // 更新用户
    async updateRole () {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) {

        } else {
          this.btnDisabled = true
          this.btnLoading = true
          const { data: res } = await this.$http.put(
            'role/update/' + this.editForm.roleId,
            this.editForm
          )
          if (res.code === 200) {
            this.$notify({
              title: '成功',
              message: '角色信息更新',
              type: 'success'
            })
            this.getRoleList()
          } else {
            this.$message.error('角色信息更新失败:' + res.msg)
          }

          this.editDialogVisible = false
          this.btnDisabled = false
          this.btnLoading = false
          this.editForm = {}
        }
      })
    },
    // 删除
    async del (roleId) {
      var res = await this.$confirm(
        '此操作将永久删除该角色, 是否继续?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
      if (res === 'confirm') {
        const { data: res } = await this.$http.delete('role/delete/' + roleId)

        if (res.code === 200) {
          this.$message.success('删除成功')
          this.getRoleList()
        } else {
          this.$message.error('删除失败:' + res.msg)
        }
      }
    },
    // 改变用户禁用状态
    async changRoleStatus (row) {
      const { data: res } = await this.$http.put(
        'role/updateStatus/' + row.roleId + '/' + row.state
      )
      if (res.code !== 200) {
        this.$message.error('更新状态失败:' + res.msg)
        row.state = !row.state
      } else {
        this.$message.success('更新状态成功')
      }
    },
    // 改变页码
    handleSizeChange (newSize) {
      this.queryMap.pageSize = newSize
      this.getRoleList()
    },
    // 翻页
    handleCurrentChange (current) {
      this.queryMap.pageNum = current
      this.getRoleList()
    }
  },
  created () {
    this.getRoleList()
    setTimeout(() => {
      this.loading = false
    }, 500)
  }
}
</script>
