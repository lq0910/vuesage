const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

async function testComponent() {
  try {
    const component = fs.readFileSync('./test/TestComponent.vue', 'utf8');
    
    // 1. 分析组件
    console.log(chalk.blue('🔍 分析组件...'));
    const analysisResponse = await axios.post('http://localhost:3000/analyze', { component });
    console.log(chalk.green('\n分析结果:'));
    console.log(JSON.stringify(analysisResponse.data, null, 2));
    
    // 2. 修复问题
    if (analysisResponse.data.summary.hasAutoFixableIssues) {
      console.log(chalk.blue('\n🔧 修复问题...'));
      const fixResponse = await axios.post('http://localhost:3000/fix', {
        component,
        issues: analysisResponse.data.issues.flatMap(category => category.issues)
      });
      
      // 保存修复后的组件
      const fixedComponentPath = './test/TestComponent.fixed.vue';
      fs.writeFileSync(fixedComponentPath, fixResponse.data.fixedComponent);
      
      console.log(chalk.green('\n修复结果:'));
      console.log('应用的修复:');
      fixResponse.data.appliedFixes.forEach(fix => {
        console.log(chalk.cyan(`- ${fix.message}`));
      });
      
      // 处理新生成的文件
      const newFiles = fixResponse.data.appliedFixes.filter(fix => fix.type === 'newFile');
      if (newFiles.length > 0) {
        console.log('\n生成的新文件:');
        newFiles.forEach(file => {
          const path = `./test/${file.filename}`;
          fs.mkdirSync(require('path').dirname(path), { recursive: true });
          fs.writeFileSync(path, file.content);
          console.log(chalk.cyan(`- ${file.filename}`));
        });
      }
      
      console.log(chalk.green(`\n✨ 修复后的组件已保存到: ${fixedComponentPath}`));
    } else {
      console.log(chalk.yellow('\n没有发现可自动修复的问题'));
    }
  } catch (error) {
    console.error(chalk.red('❌ 错误:'), error.response?.data || error.message);
  }
}

testComponent(); 