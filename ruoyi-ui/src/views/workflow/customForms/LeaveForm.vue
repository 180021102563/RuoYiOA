<template>
  <div class="leave-form-wrapper">
    <el-form ref="formRef" :model="_form" :rules="rules" :disabled="disabled"
             label-width="100px" style="max-width: 680px; margin: 0 auto;">

      <el-divider content-position="left">基本信息</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="申请人" prop="applicant">
            <el-input v-model="_form.applicant" placeholder="请选择" :disabled="true" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="_form.department" placeholder="自动获取" :disabled="true" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">请假信息</el-divider>

      <el-form-item label="请假类型" prop="leaveType">
        <el-radio-group v-model="_form.leaveType">
          <el-radio label="annual">年假</el-radio>
          <el-radio label="personal">事假</el-radio>
          <el-radio label="sick">病假</el-radio>
          <el-radio label="marriage">婚假</el-radio>
          <el-radio label="compensatory">调休</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="_form.startTime" type="datetime"
                            placeholder="选择开始时间" value-format="yyyy-MM-dd HH:mm:ss"
                            style="width: 100%" @change="calcDays" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="_form.endTime" type="datetime"
                            placeholder="选择结束时间" value-format="yyyy-MM-dd HH:mm:ss"
                            style="width: 100%" @change="calcDays" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="请假天数" prop="days">
            <el-input-number v-model="_form.days" :min="0.5" :max="30" :step="0.5"
                             :precision="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="紧急程度" prop="urgency">
            <el-rate v-model="_form.urgency" :max="3" :texts="['普通', '紧急', '特急']"
                     show-text style="padding-top: 6px;" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="请假原因" prop="reason">
        <el-input v-model="_form.reason" type="textarea" :rows="4"
                  placeholder="请详细说明请假原因" maxlength="500" show-word-limit />
      </el-form-item>

      <!-- 发起流程时显示提交/重置按钮 -->
      <el-form-item v-if="showButtons && !disabled" style="text-align: center; margin-top: 30px;">
        <el-button type="primary" size="medium" icon="el-icon-s-promotion" @click="handleSubmit">
          提 交 申 请
        </el-button>
        <el-button size="medium" icon="el-icon-refresh-left" @click="handleCancel">
          重 置
        </el-button>
      </el-form-item>

      <!-- 审批场景提示 -->
      <el-alert v-if="!showButtons && !disabled"
                title="请填写审批意见后点击下方审批按钮（通过/拒绝/退回）完成审批"
                type="info" :closable="false" show-icon style="margin-top: 20px;" />
    </el-form>
  </div>
</template>

<script>
import { getInfo } from '@/api/login'
import workflowFormMixin from '@/mixins/workflowFormMixin'

export default {
  name: 'LeaveForm',
  mixins: [workflowFormMixin],

  data() {
    return {
      // ===== 字段定义（mixin 根据此定义自动完成数据回填和默认值） =====
      formDef: {
        applicant:   { type: 'string', default: '',          required: true,  label: '申请人' },
        department:  { type: 'string', default: '',          required: true,  label: '部门' },
        leaveType:   { type: 'string', default: '',          required: true,  label: '请假类型' },
        startTime:   { type: 'string', default: '',          required: true,  label: '开始时间' },
        endTime:     { type: 'string', default: '',          required: true,  label: '结束时间' },
        days:        { type: 'number', default: undefined,   required: true,  label: '请假天数' },
        urgency:     { type: 'number', default: 1,           required: false, label: '紧急程度' },
        reason:      { type: 'string', default: '',          required: true,  label: '请假原因' },
        attachments: { type: 'array',  default: [],          required: false, label: '附件' }
      }
    }
  },

  computed: {
    /** 校验规则 */
    rules() {
      return {
        applicant:  [{ required: true, message: '请输入申请人', trigger: 'blur' }],
        department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
        leaveType:  [{ required: true, message: '请选择请假类型', trigger: 'change' }],
        startTime:  [{ required: true, message: '请选择开始时间', trigger: 'change' }],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
          { validator: this.validateEndTime, trigger: 'change' }
        ],
        days:  [{ required: true, message: '请输入请假天数', trigger: 'blur' }],
        reason: [
          { required: true, message: '请输入请假原因', trigger: 'blur' },
          { min: 5, message: '请假原因不少于5个字', trigger: 'blur' }
        ]
      }
    }
  },

  mounted() {
    this.initCurrentUser()
  },

  methods: {
    /** 自动获取当前用户（仅发起流程、无历史数据时） */
    async initCurrentUser() {
      if (this.formData && Object.keys(this.formData).length > 0) return

      try {
        const res = await getInfo()
        const user = res.data?.user
        if (user) {
          this._form.applicant = user.nickName || user.userName || ''
          this._form.department = user.dept?.deptName || ''
        }
      } catch {
        this._form.applicant = this.$store?.state?.user?.name || ''
      }
    },

    /** 自定义校验：结束时间 > 开始时间 */
    validateEndTime(rule, value, callback) {
      if (this._form.startTime && value) {
        if (new Date(value) <= new Date(this._form.startTime)) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    },

    /** 自动计算请假天数 */
    calcDays() {
      if (this._form.startTime && this._form.endTime) {
        const diff = (new Date(this._form.endTime) - new Date(this._form.startTime)) / 3600000
        this._form.days = Math.ceil(diff / 12) / 2 // 半天精度
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.leave-form-wrapper {
  padding: 10px 0;
}
.el-divider {
  margin: 16px 0 20px 0;
}
</style>
